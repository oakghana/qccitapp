import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      device_type,
      brand,
      model,
      serial_number,
      status,
      location,
      assigned_to,
      purchase_date,
      warranty_expiry,
      userRole,
      userLocation,
    } = body

    if (!id) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    const canManage =
      userRole === "admin" || userRole === "it_staff" || userRole === "it_head" || userRole === "regional_it_head"

    if (!canManage) {
      return NextResponse.json({ error: "Unauthorized: You don't have permission to edit devices" }, { status: 403 })
    }

    const supabase = await createServerClient()

    const { data: currentDevice } = await supabase.from("devices").select("*").eq("id", id).single()

    if (!currentDevice) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    await supabase.from("audit_logs").insert({
      username: assigned_to || "System",
      action: "DEVICE_UPDATED",
      resource: `devices/${id}`,
      details: `Updated device: ${brand} ${model} (${serial_number})`,
      severity: "medium",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    const { data, error: updateError } = await supabase
      .from("devices")
      .update({
        device_type,
        brand,
        model,
        serial_number,
        status,
        location,
        assigned_to,
        purchase_date,
        warranty_expiry,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
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

// Keep existing PUT handler for backward compatibility
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
