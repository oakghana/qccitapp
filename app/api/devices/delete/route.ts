import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, userId, userRole, userLocation, reason } = body

    console.log("[v0] Deleting device:", deviceId, "by:", userId, "role:", userRole)

    if (!deviceId || !userId || !userRole) {
      return NextResponse.json({ error: "Device ID, user ID, and role are required" }, { status: 400 })
    }

    // Fetch the device to verify assignment status
    const { data: device, error: fetchError } = await supabaseAdmin
      .from("devices")
      .select("id, serial_number, brand, model, assigned_to, status, location")
      .eq("id", deviceId)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching device:", fetchError)
      return NextResponse.json({ error: "Device not found" }, { status: 404 })
    }

    // Authorization checks:
    // 1. Admin and IT Head can always delete any device
    // 2. Regional IT Heads can delete any device in their location
    // 3. IT Staff can delete devices in their location (especially for duplicate management)
    // 4. Other users can delete only unassigned devices in their location
    const canAlwaysDelete = userRole === "admin" || userRole === "it_head"
    const isRegionalHeadOrITStaff = userRole === "regional_it_head" || userRole === "it_staff"
    const isInUserLocation = device.location === userLocation
    const isUnassigned = !device.assigned_to || device.status === "available" || device.status === "in_stock"

    if (!canAlwaysDelete) {
      if (isRegionalHeadOrITStaff && isInUserLocation) {
        // Regional IT Head and IT Staff can delete devices in their location
      } else if (isUnassigned && isInUserLocation) {
        // Other users can delete unassigned devices in their location
      } else {
        console.error("[v0] Unauthorized delete attempt")
        return NextResponse.json(
          { 
            error: "You can only delete devices in your location. Contact Admin or IT Head for other locations." 
          }, 
          { status: 403 }
        )
      }
    }

    // Delete the device
    const { data, error } = await supabaseAdmin
      .from("devices")
      .delete()
      .eq("id", deviceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error deleting device:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the deletion
    await supabaseAdmin.from("audit_logs").insert({
      username: userId,
      action: "DELETE_DEVICE",
      resource: `devices/${deviceId}`,
      details: `Deleted device: ${device.brand} ${device.model} (${device.serial_number}). Reason: ${reason || "Not provided"}`,
      severity: "high",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    console.log("[v0] Device deleted successfully:", deviceId)

    return NextResponse.json({ 
      success: true, 
      message: `Device ${device.serial_number} has been deleted`
    })
  } catch (error) {
    console.error("[v0] API Devices Delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
