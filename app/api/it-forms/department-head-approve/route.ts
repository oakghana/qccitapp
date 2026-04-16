import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { requisitionId, action, approvedBy, notes } = await request.json()

    if (!requisitionId || !action || !approvedBy || !notes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
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

    // Update the requisition based on action
    const updateData: any = {
      department_head_notes: notes,
      updated_at: new Date().toISOString(),
    }

    if (action === "approve") {
      updateData.department_head_approved = true
      updateData.department_head_approved_by = approvedBy
      updateData.department_head_approved_at = new Date().toISOString()
      updateData.status = "pending_service_desk"
    } else {
      updateData.department_head_approved = false
      updateData.department_head_approved_by = approvedBy
      updateData.department_head_approved_at = new Date().toISOString()
      updateData.status = "rejected_department_head"
    }

    // Update the approval chain
    const approvalChain = requisition.approval_chain || []
    approvalChain.push({
      approver: approvedBy,
      role: "department_head",
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

    // Create notification for the requester
    await supabaseAdmin.from("notifications").insert({
      recipient_id: requisition.requested_by,
      recipient_type: "staff",
      title: `Department Head ${action === "approve" ? "Approved" : "Rejected"} Your Request`,
      message: `Your IT equipment requisition ${requisition.requisition_number} has been ${action === "approve" ? "approved" : "rejected"} by your department head.`,
      type: "it_form_update",
      related_id: requisitionId,
      related_type: "it_equipment_requisition",
      read: false,
    }).catch(err => console.error("[v0] Error creating notification:", err))

    // If approved, create notification for IT Service Desk
    if (action === "approve") {
      await supabaseAdmin.from("notifications").insert({
        recipient_id: "service_desk",
        recipient_type: "service_desk",
        title: "New IT Requisition Waiting for Processing",
        message: `Requisition ${requisition.requisition_number} from ${requisition.requested_by} is ready for processing.`,
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
    console.error("[v0] API Error in department head approval:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
