import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server" // Using createClient instead of createServerClient for user auth

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile for role and location
    const { data: profile } = await supabase.from("profiles").select("role, location").eq("id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Determine if user can see all locations
    const canSeeAllLocations =
      profile.role === "admin" ||
      profile.role === "it_head" ||
      (profile.role === "it_store_head" && profile.location === "Head Office")

    // Build query for devices
    let devicesQuery = supabase
      .from("devices")
      .select("id, device_type, status, location, brand, model, assigned_to, purchase_date, warranty_expiry")

    // Filter by location for regional users
    if (!canSeeAllLocations && profile.location) {
      devicesQuery = devicesQuery.eq("location", profile.location)
    }

    const { data: devices, error: devicesError } = await devicesQuery

    if (devicesError) {
      console.error("[v0] Error fetching devices:", devicesError)
      return NextResponse.json({ error: devicesError.message }, { status: 500 })
    }

    // Calculate summary statistics by location
    const locationSummary: Record<string, any> = {}
    devices?.forEach((device) => {
      if (!locationSummary[device.location]) {
        locationSummary[device.location] = {
          total: 0,
          assigned: 0,
          available: 0,
          inRepair: 0,
          retired: 0,
          byType: {},
        }
      }

      const loc = locationSummary[device.location]
      loc.total++

      // Count by status
      if (device.status === "assigned") loc.assigned++
      else if (device.status === "available") loc.available++
      else if (device.status === "repair") loc.inRepair++
      else if (device.status === "retired") loc.retired++

      // Count by type
      if (!loc.byType[device.device_type]) {
        loc.byType[device.device_type] = 0
      }
      loc.byType[device.device_type]++
    })

    // Calculate summary statistics by device type
    const deviceTypeSummary: Record<string, any> = {}
    devices?.forEach((device) => {
      if (!deviceTypeSummary[device.device_type]) {
        deviceTypeSummary[device.device_type] = {
          total: 0,
          assigned: 0,
          available: 0,
          inRepair: 0,
          retired: 0,
          locations: {},
        }
      }

      const type = deviceTypeSummary[device.device_type]
      type.total++

      // Count by status
      if (device.status === "assigned") type.assigned++
      else if (device.status === "available") type.available++
      else if (device.status === "repair") type.inRepair++
      else if (device.status === "retired") type.retired++

      // Count by location
      if (!type.locations[device.location]) {
        type.locations[device.location] = 0
      }
      type.locations[device.location]++
    })

    // Calculate overall totals
    const overallSummary = {
      totalDevices: devices?.length || 0,
      totalAssigned: devices?.filter((d) => d.status === "assigned").length || 0,
      totalAvailable: devices?.filter((d) => d.status === "available").length || 0,
      totalInRepair: devices?.filter((d) => d.status === "repair").length || 0,
      totalRetired: devices?.filter((d) => d.status === "retired").length || 0,
      uniqueLocations: Object.keys(locationSummary).length,
      uniqueDeviceTypes: Object.keys(deviceTypeSummary).length,
    }

    return NextResponse.json({
      overall: overallSummary,
      byLocation: locationSummary,
      byDeviceType: deviceTypeSummary,
      userRole: profile.role,
      userLocation: profile.location,
      canSeeAllLocations,
    })
  } catch (error: any) {
    console.error("[v0] Device summary report error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
