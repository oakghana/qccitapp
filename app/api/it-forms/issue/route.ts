import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      requisitionId,
      issuedBy,
      itemsIssued,
      notes,
    } = body

    console.log("[it-issuance] Processing issuance:", { requisitionId, issuedBy })

    // Fetch the current requisition
    const { data: requisition, error: fetchError } = await supabaseAdmin
      .from("it_equipment_requisitions")
      .select("*")
      .eq("id", requisitionId)
      .single()

    if (fetchError || !requisition) {
      console.error("[it-issuance] Requisition not found:", fetchError)
      return NextResponse.json(
        { error: "Requisition not found" },
        { status: 404 }
      )
    }

    // Update approval chain with issuance info
    let approvalChain = requisition.approval_timeline || requisition.approval_chain || []
    approvalChain.push({
      approver: issuedBy,
      role: "it_store_head",
      action: "issued",
      notes: notes || "",
      timestamp: new Date().toISOString(),
      items_issued: itemsIssued,
    })

    // Update the requisition to issued status
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("it_equipment_requisitions")
      .update({
        status: "issued",
        approval_timeline: approvalChain,
        items_issued: itemsIssued,
        issued_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requisitionId)
      .select()

    if (updateError) {
      console.error("[it-issuance] Error updating requisition:", updateError)
      return NextResponse.json(
        { error: updateError.message || "Failed to issue items" },
        { status: 500 }
      )
    }

    console.log("[it-issuance] Items issued successfully:", updated)

    return NextResponse.json({
      success: true,
      message: "Items issued successfully",
      requisition: updated?.[0],
    })

  } catch (error: any) {
    console.error("[it-issuance] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
