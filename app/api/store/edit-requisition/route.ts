import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { requisitionId, updates, updatedBy } = body

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

    // Only allow editing if status is pending or rejected
    if (requisition.status !== "pending" && requisition.status !== "rejected") {
      return NextResponse.json(
        { error: `Cannot edit requisition with status: ${requisition.status}` },
        { status: 400 },
      )
    }

    // Update the requisition
    const { data: updatedRequisition, error: updateError } = await supabaseAdmin
      .from("store_requisitions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requisitionId)
      .select()

    if (updateError) {
      console.error("[v0] Error updating requisition:", updateError)
      return NextResponse.json({ error: "Failed to update requisition" }, { status: 500 })
    }

    // Log the update
    await supabaseAdmin.from("activity_logs").insert({
      action: "update_requisition",
      entity_type: "store_requisition",
      entity_id: requisitionId,
      performed_by: updatedBy,
      details: `Updated requisition: ${JSON.stringify(updates)}`,
      timestamp: new Date().toISOString(),
    })

    console.log("[v0] Requisition updated successfully:", requisitionId)

    return NextResponse.json({
      success: true,
      message: "Requisition updated successfully",
      requisition: updatedRequisition[0],
    })
  } catch (error: any) {
    console.error("[v0] Error in edit-requisition route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
