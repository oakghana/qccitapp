import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { itemId, deletedBy, reason } = body

    if (!itemId || !deletedBy || !reason) {
      return NextResponse.json({ error: "Item ID, deleted by, and reason are required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get item details before deletion
    const { data: item, error: fetchError } = await supabase.from("store_items").select("*").eq("id", itemId).single()

    if (fetchError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Log the deletion with reason
    const { error: logError } = await supabase.from("stock_audit_log").insert({
      item_id: itemId,
      action: "delete",
      updated_by: deletedBy,
      reason: reason,
      changes: { deleted_item: item },
      created_at: new Date().toISOString(),
    })

    if (logError) {
      console.error("[v0] Error logging stock deletion:", logError)
    }

    // Delete the item
    const { error: deleteError } = await supabase.from("store_items").delete().eq("id", itemId)

    if (deleteError) {
      console.error("[v0] Error deleting stock item:", deleteError)
      return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Item deleted successfully" })
  } catch (error: any) {
    console.error("[v0] Error in delete-item route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
