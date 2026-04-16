import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type FormType = "requisition" | "new-gadget" | "maintenance"

const FORM_CONFIG: Record<FormType, { table: string; numberField: string; requesterField: string; relatedType: string }> = {
  requisition: {
    table: "it_equipment_requisitions",
    numberField: "requisition_number",
    requesterField: "requested_by",
    relatedType: "it_equipment_requisition",
  },
  "new-gadget": {
    table: "new_gadget_requests",
    numberField: "request_number",
    requesterField: "staff_name",
    relatedType: "new_gadget_request",
  },
  maintenance: {
    table: "maintenance_repair_requests",
    numberField: "request_number",
    requesterField: "staff_name",
    relatedType: "maintenance_repair_request",
  },
}

export async function POST(request: NextRequest) {
  try {
    const { requisitionId, action, approvedBy, notes, formType = "requisition" } = await request.json()

    if (!requisitionId || !action || !approvedBy || !notes) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be 'approve' or 'reject'" }, { status: 400 })
    }

    const config = FORM_CONFIG[formType as FormType]
    if (!config) {
      return NextResponse.json({ error: "Unsupported form type" }, { status: 400 })
    }

    const { data: requisition, error: fetchError } = await supabaseAdmin
      .from(config.table)
      .select("*")
      .eq("id", requisitionId)
      .single()

    if (fetchError || !requisition) {
      console.error("[v0] Error fetching requisition:", fetchError)
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    const now = new Date().toISOString()
    const updateData: any = {
      updated_at: now,
      status:
        formType === "requisition"
          ? action === "approve"
            ? "pending_service_desk"
            : "rejected_department_head"
          : action === "approve"
            ? "hod_approved"
            : "rejected",
    }

    if (formType === "requisition") {
      updateData.department_head_notes = notes
      updateData.department_head_approved = action === "approve"
      updateData.department_head_approved_by = approvedBy
      updateData.department_head_approved_at = now

      const approvalChain = requisition.approval_timeline || requisition.approval_chain || []
      approvalChain.push({
        approver: approvedBy,
        role: "department_head",
        action,
        notes,
        timestamp: now,
      })
      updateData.approval_timeline = approvalChain
    }

    if (formType === "new-gadget") {
      updateData.departmental_head_name = approvedBy
      updateData.departmental_head_date = now.split("T")[0]
      updateData.other_comments = [
        requisition.other_comments,
        `HOD ${action === "approve" ? "approval" : "rejection"} note: ${notes}`,
      ]
        .filter(Boolean)
        .join("\n")
    }

    if (formType === "maintenance") {
      updateData.sectional_head_name = approvedBy
      updateData.sectional_head_date = now.split("T")[0]
      updateData.other_comments = [
        requisition.other_comments,
        `HOD ${action === "approve" ? "approval" : "rejection"} note: ${notes}`,
      ]
        .filter(Boolean)
        .join("\n")
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from(config.table)
      .update(updateData)
      .eq("id", requisitionId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating requisition:", updateError)
      return NextResponse.json({ error: "Failed to update request" }, { status: 500 })
    }

    const requestNumber = requisition[config.numberField]
    const requesterName = requisition[config.requesterField]

    if (requisition.requested_by_id) {
      await supabaseAdmin
        .from("notifications")
        .insert({
          recipient_id: requisition.requested_by_id,
          recipient_type: "staff",
          title: `Department Head ${action === "approve" ? "Approved" : "Rejected"} Your Request`,
          message: `Your request ${requestNumber} has been ${action === "approve" ? "approved" : "rejected"} by your department head.`,
          type: "it_form_update",
          related_id: requisitionId,
          related_type: config.relatedType,
          read: false,
        })
        .catch((err) => console.error("[v0] Error creating notification:", err))
    }

    if (action === "approve") {
      await supabaseAdmin
        .from("notifications")
        .insert({
          recipient_id: "service_desk",
          recipient_type: "service_desk",
          title: "New Staff Request Waiting for Processing",
          message: `Request ${requestNumber} from ${requesterName} is ready for service desk processing.`,
          type: "it_form_update",
          related_id: requisitionId,
          related_type: config.relatedType,
          read: false,
        })
        .catch((err) => console.error("[v0] Error creating service desk notification:", err))
    }

    return NextResponse.json({ success: true, requisition: updated })
  } catch (error) {
    console.error("[v0] API Error in department head approval:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
