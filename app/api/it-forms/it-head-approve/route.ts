import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { requisitionId, action, approvedBy, notes } = await request.json()

    const { data: requisition } = await supabaseAdmin
      .from("it_equipment_requisitions")
      .select()
      .eq("id", requisitionId)
      .single()

    if (!requisition) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updateData: any = {
      it_head_notes: notes,
      updated_at: new Date().toISOString(),
    }

    if (action === "approve") {
      updateData.it_head_approved = true
      updateData.status = "pending_admin"
    } else {
      updateData.it_head_approved = false
      updateData.status = "rejected_it_head"
    }

    const approvalChain = requisition.approval_chain || []
    approvalChain.push({
      approver: approvedBy,
      role: "it_head",
      action,
      notes,
      timestamp: new Date().toISOString(),
    })
    updateData.approval_chain = approvalChain

    const { data: updated } = await supabaseAdmin
      .from("it_equipment_requisitions")
      .update(updateData)
      .eq("id", requisitionId)
      .select()
      .single()

    // Notify relevant parties
    await supabaseAdmin.from("notifications").insert({
      recipient_id: action === "approve" ? "admin" : requisition.requested_by,
      recipient_type: action === "approve" ? "admin" : "staff",
      title: `IT Head ${action === "approve" ? "Approved" : "Rejected"} Requisition`,
      message: `Requisition ${requisition.requisition_number} was ${action === "approve" ? "approved and forwarded to Admin" : "rejected"}`,
      type: "it_form_update",
      related_id: requisitionId,
      related_type: "it_equipment_requisition",
      read: false,
    }).catch(err => console.error("[v0] Notification error:", err))

    return NextResponse.json({ success: true, requisition: updated })
  } catch (error) {
    console.error("[v0] API Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
