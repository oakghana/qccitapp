import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      requisitionId,
      action,
      approvedBy,
      approverRole,
      notes,
    } = body

    if (!["approve", "reject", "submit"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve', 'reject', or 'submit'" },
        { status: 400 }
      )
    }

    console.log("[it-approvals] Processing action:", { requisitionId, action, approverRole })

    // Fetch the current requisition
    const { data: requisition, error: fetchError } = await supabaseAdmin
      .from("it_equipment_requisitions")
      .select("*")
      .eq("id", requisitionId)
      .single()

    if (fetchError || !requisition) {
      console.error("[it-approvals] Requisition not found:", fetchError)
      return NextResponse.json(
        { error: "Requisition not found" },
        { status: 404 }
      )
    }

    // Determine new status based on action
    let newStatus = requisition.status
    let approvalChain = requisition.approval_chain || []

    if (action === "submit") {
      newStatus = "pending"
    } else if (action === "approve") {
      // Move to next approval stage
      if (requisition.status === "pending") {
        newStatus = "approved_service_desk"
      } else if (requisition.status === "approved_service_desk") {
        newStatus = "approved_it_head"
      } else if (requisition.status === "approved_it_head") {
        newStatus = "approved_admin"
      } else if (requisition.status === "approved_admin") {
        newStatus = "ready_for_issuance"
      }
    } else if (action === "reject") {
      newStatus = "rejected"
    }

    // Add to approval chain
    approvalChain.push({
      approver: approvedBy,
      role: approverRole,
      action: action,
      notes: notes || "",
      timestamp: new Date().toISOString(),
    })

    // Update the requisition
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("it_equipment_requisitions")
      .update({
        status: newStatus,
        approval_chain: approvalChain,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requisitionId)
      .select()

    if (updateError) {
      console.error("[it-approvals] Error updating requisition:", updateError)
      return NextResponse.json(
        { error: updateError.message || "Failed to update requisition" },
        { status: 500 }
      )
    }

    console.log("[it-approvals] Requisition updated successfully:", updated)

    return NextResponse.json({
      success: true,
      message: `Requisition ${action}ed successfully`,
      requisition: updated?.[0],
    })

  } catch (error: any) {
    console.error("[it-approvals] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
