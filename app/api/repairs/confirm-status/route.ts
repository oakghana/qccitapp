import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      repairTaskId,
      status,
      actualCost,
      notes,
      workCompletedAt,
      confirmedBy,
    } = body

    if (!repairTaskId || !status) {
      return NextResponse.json(
        { error: "repairTaskId and status are required" },
        { status: 400 }
      )
    }

    const validStatuses = ["pending", "assigned", "in_progress", "completed", "returned", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      )
    }

    // Update repair task
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === "in_progress" && !workStartedAt) {
      updateData.work_started_at = new Date().toISOString()
    }

    if (status === "completed") {
      updateData.work_completed_at = workCompletedAt || new Date().toISOString()
      updateData.actual_cost = actualCost ? parseFloat(actualCost) : null
    }

    if (status === "returned" || status === "completed") {
      updateData.confirmed_by = confirmedBy
      updateData.confirmed_at = new Date().toISOString()
    }

    if (notes) {
      updateData.notes = notes
    }

    const { data: repairTask, error: updateError } = await supabaseAdmin
      .from("repair_tasks")
      .update(updateData)
      .eq("id", repairTaskId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating repair task:", updateError)
      return NextResponse.json(
        { error: "Failed to update repair task" },
        { status: 500 }
      )
    }

    // Update device status if repair is completed or returned
    if (status === "returned" || status === "completed") {
      await supabaseAdmin
        .from("devices")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", repairTask.device_id)
    }

    // Log to repair audit trail
    try {
      await supabaseAdmin.from("repair_audit_trail").insert({
        repair_task_id: repairTaskId,
        action: `Status changed to ${status}`,
        changed_by: confirmedBy || "system",
        change_details: {
          previous_status: repairTask.status,
          new_status: status,
          notes,
          actual_cost: actualCost,
        },
        created_at: new Date().toISOString(),
      })
    } catch (auditError) {
      console.error("[v0] Error logging to audit trail:", auditError)
      // Don't fail the update if audit logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Repair status updated to ${status}`,
      task: repairTask,
    })
  } catch (error: any) {
    console.error("[v0] Error in repair confirm API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
