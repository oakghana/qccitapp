import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { deviceId, updates, updatedBy, reason, userRole } = body

    if (!deviceId || !updates || !updatedBy || !userRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const canManage = userRole === "admin" || userRole === "it_staff" || userRole === "it_head"

    if (!canManage) {
      console.error("[v0] Unauthorized device update attempt by:", updatedBy, userRole)
      return NextResponse.json({ error: "Unauthorized: You don't have permission to edit devices" }, { status: 403 })
    }

    const supabase = await createServerClient()

    const { data: currentDevice } = await supabase.from("devices").select("*").eq("id", deviceId).single()

    if (!currentDevice) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    await supabase.from("audit_logs").insert({
      user: updatedBy,
      action: "DEVICE_UPDATED",
      resource: `devices/${deviceId}`,
      details: `Updated device: ${currentDevice.brand} ${currentDevice.model} (${currentDevice.serial_number}). Reason: ${reason || "Not provided"}`,
      severity: "medium",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    const { data, error: updateError } = await supabase
      .from("devices")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", deviceId)
      .select()

    if (updateError) {
      console.error("[v0] Error updating device:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Device updated successfully", data })
  } catch (error: any) {
    console.error("[v0] Error in update-device route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
