import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { requisitionId, updates, updatedBy, reason, userRole } = body

    if (!requisitionId || !updates || !updatedBy || !userRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const canManage =
      userRole === "admin" || userRole === "it_store_head" || userRole === "it_staff" || userRole === "it_head"

    if (!canManage) {
      console.error("[v0] Unauthorized requisition update attempt by:", updatedBy, userRole)
      return NextResponse.json(
        { error: "Unauthorized: You don't have permission to edit requisitions" },
        { status: 403 },
      )
    }

    const supabase = await createServerClient()

    const { data: currentReq } = await supabase.from("store_requisitions").select("*").eq("id", requisitionId).single()

    if (!currentReq) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
    }

    if (currentReq.status === "issued" || currentReq.status === "rejected") {
      return NextResponse.json(
        {
          error: `Cannot edit ${currentReq.status} requisitions. Only pending or approved requisitions can be edited.`,
        },
        { status: 400 },
      )
    }

    await supabase.from("audit_logs").insert({
      user: updatedBy,
      action: "REQUISITION_UPDATED",
      resource: `store_requisitions/${requisitionId}`,
      details: `Updated requisition: ${currentReq.requisition_number}. Reason: ${reason || "Not provided"}`,
      severity: "medium",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    const { data, error: updateError } = await supabase
      .from("store_requisitions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requisitionId)
      .select()

    if (updateError) {
      console.error("[v0] Error updating requisition:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Requisition updated successfully", data })
  } catch (error: any) {
    console.error("[v0] Error in update-requisition route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
