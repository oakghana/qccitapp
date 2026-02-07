import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getCanonicalLocationName } from "@/lib/location-filter"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const searchParams = request.nextUrl.searchParams
    const userName = searchParams.get("userName")

    // Get username from query parameters (same pattern as device summary)
    const requestingUser = searchParams.get("requestingUser")

    if (!requestingUser) {
      return NextResponse.json({ error: "Missing requesting user" }, { status: 400 })
    }

    // Verify requesting user exists and is active
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, location, username")
      .eq("username", requestingUser)
      .eq("is_active", true)
      .single()

    if (profileError || !profile) {
      console.error("[v0] Profile fetch error:", profileError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all users for the dropdown
    const { data: allUsers, error: usersError } = await supabase
      .from("profiles")
      .select("id, username, full_name, role, location")
      .eq("is_active", true)
      .order("full_name")

    if (usersError) {
      console.error("[v0] Error fetching users:", usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    let devicesQuery = supabase
      .from("devices")
      .select(
        "id, device_type, brand, model, serial_number, status, location, assigned_to, purchase_date, warranty_expiry, created_at",
      )
      .order("created_at", { ascending: false })

    if (userName) {
      // Search for devices assigned to this user (case-insensitive partial match)
      devicesQuery = devicesQuery.ilike("assigned_to", `%${userName}%`)
    }

    const { data: devices, error: devicesError } = await devicesQuery

    if (devicesError) {
      console.error("[v0] Error fetching devices:", devicesError)
      return NextResponse.json({ error: devicesError.message }, { status: 500 })
    }

    const allocationStats = {
      totalDevices: devices?.length || 0, // Count ALL devices regardless of status
      activeDevices: devices?.filter((d) => d.status === "active" || d.status === "assigned").length || 0,
      devicesInRepair: devices?.filter((d) => d.status === "repair" || d.status === "under_repair" || d.status === "in_repair").length || 0,
      retiredDevices: devices?.filter((d) => d.status === "retired" || d.status === "disposed").length || 0,
      byDeviceType: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
    }

    // Validation: ensure sum breakdown doesn't exceed total
    const breakdown = allocationStats.activeDevices + allocationStats.devicesInRepair + allocationStats.retiredDevices
    const unaccountedDevices = Math.max(0, allocationStats.totalDevices - breakdown)

    console.log("[v0] Device allocation stats - Total: %d, Active: %d, Repair: %d, Retired: %d, Unaccounted: %d",
      allocationStats.totalDevices, allocationStats.activeDevices, allocationStats.devicesInRepair, 
      allocationStats.retiredDevices, unaccountedDevices)

    devices?.forEach((device) => {
      // Count by type
      if (!allocationStats.byDeviceType[device.device_type]) {
        allocationStats.byDeviceType[device.device_type] = 0
      }
      allocationStats.byDeviceType[device.device_type]++

      // Count by location – merge duplicates via canonical name
      const canonicalLocation = getCanonicalLocationName(device.location)
      if (!allocationStats.byLocation[canonicalLocation]) {
        allocationStats.byLocation[canonicalLocation] = 0
      }
      allocationStats.byLocation[canonicalLocation]++
    })

    return NextResponse.json({
      users: allUsers,
      devices,
      stats: allocationStats,
      selectedUser: userName || null,
    })
  } catch (error: any) {
    console.error("[v0] User allocation summary error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
