import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { requisitionId, action, processedBy, notes } = await request.json()

    if (!requisitionId || !action || !processedBy || !notes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get the current requisition
    const { data: requisition, error: fetchError } = await supabaseAdmin
      .from("it_equipment_requisitions")
      .select()
      .eq("id", requisitionId)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching requisition:", fetchError)
      return NextResponse.json(
        { error: "Requisition not found" },
        { status: 404 }
      )
    }

    // Update the requisition
    const updateData: any = {
      service_desk_notes: notes,
      service_desk_processed_by: processedBy,
      service_desk_processed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (action === "process") {
      updateData.service_desk_approved = true
      updateData.status = "pending_it_head"
    } else if (action === "hold") {
      updateData.status = "hold_service_desk"
    }

    // Update the approval chain
    const approvalChain = requisition.approval_chain || []
    approvalChain.push({
      approver: processedBy,
      role: "service_desk",
      action: action,
      notes: notes,
      timestamp: new Date().toISOString(),
    })
    updateData.approval_chain = approvalChain

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("it_equipment_requisitions")
      .update(updateData)
      .eq("id", requisitionId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating requisition:", updateError)
      return NextResponse.json(
        { error: "Failed to update requisition" },
        { status: 500 }
      )
    }

    // Create notifications
    if (action === "process") {
      // Notify IT Head
      await supabaseAdmin.from("notifications").insert({
        recipient_id: "it_head",
        recipient_type: "it_head",
        title: "New Requisition Ready for Review",
        message: `Requisition ${requisition.requisition_number} from ${requisition.requested_by} is ready for IT Head review.`,
        type: "it_form_update",
        related_id: requisitionId,
        related_type: "it_equipment_requisition",
        read: false,
      }).catch(err => console.error("[v0] Error creating notification:", err))

      // Notify requester
      await supabaseAdmin.from("notifications").insert({
        recipient_id: requisition.requested_by,
        recipient_type: "staff",
        title: "Your Request is Being Processed",
        message: `Your IT equipment requisition ${requisition.requisition_number} is now being processed by the IT Service Desk.`,
        type: "it_form_update",
        related_id: requisitionId,
        related_type: "it_equipment_requisition",
        read: false,
      }).catch(err => console.error("[v0] Error creating notification:", err))
    }

    return NextResponse.json({
      success: true,
      requisition: updated,
    })
  } catch (error) {
    console.error("[v0] API Error in service desk processing:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
