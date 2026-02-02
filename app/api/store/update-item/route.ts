import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { itemId, updates, updatedBy, reason, userRole, userLocation } = body

    if (!itemId || !updates || !updatedBy || !userRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get current item state for authorization and audit trail
    const { data: currentItem } = await supabase.from("store_items").select("*").eq("id", itemId).single()

    if (!currentItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Check if user can manage stock for this item's location
    const canManage =
      userRole === "admin" ||
      userRole === "it_store_head" ||
      (userRole === "it_head" && userLocation === "Head Office") ||
      (userRole === "regional_it_head" && userLocation === currentItem.location)

    if (!canManage) {
      console.error("[v0] Unauthorized stock update attempt by:", updatedBy, userRole, userLocation, "for item at:", currentItem.location)
      return NextResponse.json({ error: "Unauthorized: You don't have permission to edit stock at this location" }, { status: 403 })
    }

    const auditEntry = {
      item_id: itemId,
      action: "update",
      updated_by: updatedBy,
      reason: reason || "No reason provided",
      changes: { before: currentItem, after: updates },
    }

    await supabase.from("stock_audit_log").insert(auditEntry)

    // Also log to main audit_logs table
    await supabase.from("audit_logs").insert({
      user: updatedBy,
      action: "STOCK_UPDATED",
      resource: `store_items/${itemId}`,
      details: `Updated stock item: ${currentItem?.name || itemId}. Reason: ${reason || "Not provided"}`,
      severity: "medium",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    // Update the item
    const { data, error: updateError } = await supabase
      .from("store_items")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()

    if (updateError) {
      console.error("[v0] Error updating stock item:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Item updated successfully", data })
  } catch (error: any) {
    console.error("[v0] Error in update-item route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
