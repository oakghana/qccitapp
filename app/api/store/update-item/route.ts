import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { itemId, updates, updatedBy, reason } = body

    if (!itemId || !updates || !updatedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Log the update with reason
    const { error: logError } = await supabase.from("stock_audit_log").insert({
      item_id: itemId,
      action: "update",
      updated_by: updatedBy,
      reason: reason || "No reason provided",
      changes: updates,
      created_at: new Date().toISOString(),
    })

    if (logError) {
      console.error("[v0] Error logging stock update:", logError)
    }

    // Update the item
    const { error: updateError } = await supabase
      .from("store_items")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)

    if (updateError) {
      console.error("[v0] Error updating stock item:", updateError)
      return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Item updated successfully" })
  } catch (error: any) {
    console.error("[v0] Error in update-item route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
