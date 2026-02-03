import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { requisitionId, itemsToDelete, updatedBy, userRole } = body

    if (!requisitionId || !updatedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Get the requisition
    const { data: requisition, error: fetchError } = await supabaseAdmin
      .from("store_requisitions")
      .select("*")
      .eq("id", requisitionId)
      .maybeSingle()

    if (fetchError || !requisition) {
      console.error("[v0] Error fetching requisition:", fetchError)
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
    }

    // Admin can delete ANY requisition
    // Other users can only delete pending or rejected requisitions
    const isAdmin = userRole === "admin"
    const canDelete = isAdmin || requisition.status === "pending" || requisition.status === "rejected"

    if (!canDelete) {
      return NextResponse.json(
        { error: `Cannot delete requisition with status: ${requisition.status}. Only admin can delete approved/issued requisitions.` },
        { status: 403 },
      )
    }

    // Delete the requisition
    const { error: deleteError } = await supabaseAdmin
      .from("store_requisitions")
      .delete()
      .eq("id", requisitionId)

    if (deleteError) {
      console.error("[v0] Error deleting requisition:", deleteError)
      return NextResponse.json({ error: "Failed to delete requisition" }, { status: 500 })
    }

    // Log the deletion
    await supabaseAdmin.from("activity_logs").insert({
      action: "delete_requisition",
      entity_type: "store_requisition",
      entity_id: requisitionId,
      performed_by: updatedBy,
      details: `Deleted requisition for location: ${requisition.location}`,
      timestamp: new Date().toISOString(),
    })

    console.log("[v0] Requisition deleted successfully:", requisitionId)

    return NextResponse.json({
      success: true,
      message: "Requisition deleted successfully",
      requisitionId,
    })
  } catch (error: any) {
    console.error("[v0] Error in delete-requisition route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
