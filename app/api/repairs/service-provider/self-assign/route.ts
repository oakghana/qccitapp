import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { repairId, serviceProviderId, serviceProviderName } = body

    if (!repairId || !serviceProviderId || !serviceProviderName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Update repair to assign to service provider
    const { data: updatedRepair, error: updateError } = await supabaseAdmin
      .from("repair_requests")
      .update({
        service_provider_id: serviceProviderId,
        service_provider_name: serviceProviderName,
        status: "assigned",
        assigned_date: new Date().toISOString(),
      })
      .eq("id", repairId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error assigning repair:", updateError)
      return NextResponse.json(
        { error: "Failed to assign repair" },
        { status: 500 }
      )
    }

    // Create notification for IT Head/Admin
    const { data: repairDetail } = await supabaseAdmin
      .from("repair_requests")
      .select("device_name, issue_description")
      .eq("id", repairId)
      .single()

    const notificationMessage = `${serviceProviderName} has self-assigned repair task for ${repairDetail?.device_name || "Unknown Device"}`

    await supabaseAdmin
      .from("notifications")
      .insert({
        recipient_type: "it_head",
        recipient_id: "admin",
        title: "Repair Task Self-Assigned",
        message: notificationMessage,
        type: "repair_self_assigned",
        related_id: repairId,
        related_type: "repair_request",
        read: false,
        created_at: new Date().toISOString(),
      })
      .catch((err) => {
        console.error("[v0] Error creating notification:", err)
        // Don't fail the assignment if notification fails
      })

    return NextResponse.json({
      success: true,
      repair: updatedRepair,
      message: "Repair task assigned successfully",
    })
  } catch (error: any) {
    console.error("[v0] Error in self-assign API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
