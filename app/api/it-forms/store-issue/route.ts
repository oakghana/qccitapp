import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { requisitionId, issuedBy, notes } = await request.json()

    const { data: requisition } = await supabaseAdmin
      .from("it_equipment_requisitions")
      .select()
      .eq("id", requisitionId)
      .single()

    if (!requisition) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updateData: any = {
      store_head_approved: true,
      issued_by: issuedBy,
      issued_at: new Date().toISOString(),
      issuance_notes: notes,
      status: "issued",
      updated_at: new Date().toISOString(),
    }

    const approvalChain = requisition.approval_chain || []
    approvalChain.push({
      approver: issuedBy,
      role: "store_head",
      action: "issued",
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

    // Notify staff
    await supabaseAdmin.from("notifications").insert({
      recipient_id: requisition.requested_by,
      recipient_type: "staff",
      title: "Your IT Equipment has been Issued",
      message: `Your requisition ${requisition.requisition_number} has been fulfilled and is ready for collection.`,
      type: "it_form_update",
      related_id: requisitionId,
      related_type: "it_equipment_requisition",
      read: false,
    }).catch(err => console.error("[v0]:", err))

    return NextResponse.json({ success: true, requisition: updated })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
