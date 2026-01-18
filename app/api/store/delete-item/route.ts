import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { itemId, deletedBy, reason, userRole, userLocation } = body

    if (!itemId || !deletedBy || !reason || !userRole) {
      return NextResponse.json({ error: "Item ID, deleted by, reason, and user role are required" }, { status: 400 })
    }

    // Only admin and it_head can delete stock items
    const canDelete = userRole === "admin" || userRole === "it_head"

    if (!canDelete) {
      console.error("[v0] Unauthorized stock deletion attempt by:", deletedBy, userRole)
      return NextResponse.json({ error: "Unauthorized: Only Admin and IT Head can delete stock items" }, { status: 403 })
    }

    const supabase = await createServerClient()

    // Get item details before deletion
    const { data: item, error: fetchError } = await supabase.from("store_items").select("*").eq("id", itemId).single()

    if (fetchError || !item) {
      console.error("[v0] Item not found:", fetchError)
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    await supabase.from("stock_audit_log").insert({
      item_id: itemId,
      action: "delete",
      updated_by: deletedBy,
      reason: reason,
      changes: { deleted_item: item },
    })

    // Log to main audit_logs table
    await supabase.from("audit_logs").insert({
      user: deletedBy,
      action: "STOCK_DELETED",
      resource: `store_items/${itemId}`,
      details: `Deleted stock item: ${item.name}. Reason: ${reason}`,
      severity: "high",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    // Delete the item
    const { error: deleteError } = await supabase.from("store_items").delete().eq("id", itemId)

    if (deleteError) {
      console.error("[v0] Error deleting stock item:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Item deleted successfully" })
  } catch (error: any) {
    console.error("[v0] Error in delete-item route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
