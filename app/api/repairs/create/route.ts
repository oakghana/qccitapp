import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Creating repair ticket:", body)

    const {
      deviceId,
      deviceType,
      brand,
      model,
      serialNumber,
      issueDescription,
      priority,
      estimatedCost,
      serviceProviderId,
      createdBy,
    } = body

    // Validate required fields
    if (!deviceId || !serviceProviderId || !issueDescription) {
      return NextResponse.json(
        { error: "Missing required fields: deviceId, serviceProviderId, issueDescription" },
        { status: 400 }
      )
    }

    // Generate task number
    const taskNumber = `REP-${Date.now().toString().slice(-8)}`

    // Create repair task record
    const { data: repairTask, error: repairError } = await supabase
      .from("repair_tasks")
      .insert([
        {
          task_number: taskNumber,
          device_id: deviceId,
          device_type: deviceType,
          brand,
          model,
          serial_number: serialNumber,
          issue_description: issueDescription,
          priority: priority || "medium",
          status: "assigned",
          service_provider_id: serviceProviderId,
          estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
          assigned_by: createdBy,
          assigned_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (repairError) {
      console.error("[v0] Error creating repair task:", repairError)
      return NextResponse.json(
        { error: repairError.message || "Failed to create repair ticket" },
        { status: 500 }
      )
    }

    console.log("[v0] Repair ticket created successfully:", {
      taskNumber: repairTask.task_number,
      deviceId,
      serviceProviderId,
    })

    return NextResponse.json({
      success: true,
      taskNumber: repairTask.task_number,
      task: repairTask,
    })
  } catch (error: any) {
    console.error("[v0] Error in repair creation API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
