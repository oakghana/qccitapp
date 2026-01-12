import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server" // Using createClient instead of createServerClient for user auth

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const userName = searchParams.get("userName")

    // Get current user for authorization
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("role, location").eq("id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

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
      totalDevices: devices?.length || 0,
      activeDevices: devices?.filter((d) => d.status === "active").length || 0,
      devicesInRepair: devices?.filter((d) => d.status === "repair" || d.status === "under_repair").length || 0,
      retiredDevices: devices?.filter((d) => d.status === "retired").length || 0,
      byDeviceType: {} as Record<string, number>,
      byLocation: {} as Record<string, number>,
    }

    devices?.forEach((device) => {
      // Count by type
      if (!allocationStats.byDeviceType[device.device_type]) {
        allocationStats.byDeviceType[device.device_type] = 0
      }
      allocationStats.byDeviceType[device.device_type]++

      // Count by location
      if (!allocationStats.byLocation[device.location]) {
        allocationStats.byLocation[device.location] = 0
      }
      allocationStats.byLocation[device.location]++
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
