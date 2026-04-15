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

    console.log("[v0] Validating service provider ID:", serviceProviderId)

    // Verify the service provider exists before creating repair task
    const { data: serviceProvider, error: providerCheckError } = await supabase
      .from("service_providers")
      .select("id, name, email, user_id")
      .eq("id", serviceProviderId)
      .single()

    if (providerCheckError || !serviceProvider) {
      console.error(
        "[v0] Service provider not found. ID:",
        serviceProviderId,
        "Error:",
        providerCheckError
      )
      return NextResponse.json(
        {
          error: `Service provider with ID ${serviceProviderId} not found. Please select a valid service provider.`,
        },
        { status: 400 }
      )
    }

    console.log("[v0] Service provider validated:", serviceProvider.name)

    // Generate task number
    const taskNumber = `REP-${Date.now().toString().slice(-8)}`

    // Create repair task record
    const { data: repairTask, error: repairError } = await supabase
      .from("repair_tasks")
      .insert([
        {
          task_number: taskNumber,
          device_id: deviceId,
          device_info: {
            device_type: deviceType,
            brand,
            model,
            serial_number: serialNumber,
          },
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

    // Send notification to service provider
    if (serviceProvider.user_id) {
      try {
        const notificationMessage = `New repair task assigned: ${brand} ${model} (SN: ${serialNumber || "N/A"}). Issue: ${issueDescription}. Priority: ${priority || "Medium"}`

        await supabase.from("notifications").insert({
          user_id: serviceProvider.user_id,
          title: "New Repair Task Assigned",
          message: notificationMessage,
          type: "repair_assigned",
          is_read: false,
        })

        console.log("[v0] Notification sent to service provider:", serviceProvider.user_id)
      } catch (notificationError) {
        console.error("[v0] Error sending notification:", notificationError)
        // Don't fail the repair creation if notification fails
      }
    }

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
