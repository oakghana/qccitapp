import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getCanonicalLocationName } from "@/lib/location-filter"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Get username from query parameters
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 })
    }

    // Get user profile for role and location
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, location, username")
      .eq("username", username)
      .eq("is_active", true)
      .single()

    if (profileError || !profile) {
      console.error("[v0] Profile fetch error:", profileError)
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Determine if user can see all locations
    const canSeeAllLocations = profile.role === "admin" || profile.role === "it_head"

    const isRegionalHead = profile.role === "regional_it_head"

    // Build query for devices
    let devicesQuery = supabase
      .from("devices")
      .select("id, device_type, status, location, brand, model, assigned_to, purchase_date, warranty_expiry")

    // Filter by location for regional users (case-insensitive)
    if ((isRegionalHead || !canSeeAllLocations) && profile.location) {
      devicesQuery = devicesQuery.ilike("location", profile.location)
    }

    const { data: devices, error: devicesError } = await devicesQuery

    if (devicesError) {
      console.error("[v0] Error fetching devices:", devicesError)
      return NextResponse.json({ error: devicesError.message }, { status: 500 })
    }

    // Calculate summary statistics by location (merging duplicate names)
    const locationSummary: Record<string, any> = {}
    devices?.forEach((device) => {
      const canonicalLocation = getCanonicalLocationName(device.location)
      if (!locationSummary[canonicalLocation]) {
        locationSummary[canonicalLocation] = {
          total: 0,
          assigned: 0,
          available: 0,
          inRepair: 0,
          retired: 0,
          byType: {},
        }
      }

      const loc = locationSummary[canonicalLocation]
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

      // Count by location (using canonical name)
      const canonLoc = getCanonicalLocationName(device.location)
      if (!type.locations[canonLoc]) {
        type.locations[canonLoc] = 0
      }
      type.locations[canonLoc]++
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
