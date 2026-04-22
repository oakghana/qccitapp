import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const regionId = searchParams.get("regionId")
    const type = searchParams.get("type") // "regional", "head_office", or "all"

    if (!regionId) {
      return NextResponse.json(
        { error: "Region ID is required" },
        { status: 400 }
      )
    }

    // Get all devices from this region that are under repair
    const { data: regionalDevices, error: deviceError } = await supabaseAdmin
      .from("devices")
      .select(
        `
        id,
        device_name,
        device_type,
        brand,
        model,
        serial_number,
        location,
        assigned_to,
        status,
        profiles (
          full_name,
          email
        )
        `
      )
      .eq("location", regionId)
      .eq("status", "repair")
      .order("created_at", { ascending: false })

    if (deviceError) {
      console.error("[v0] Error fetching regional devices:", deviceError)
      return NextResponse.json(
        { error: "Failed to fetch regional devices" },
        { status: 500 }
      )
    }

    // Get repair tasks for regional devices
    const deviceIds = regionalDevices?.map((d: any) => d.id) || []

    let repairsData: any[] = []

    if (deviceIds.length > 0) {
      const { data: repairs, error: repairsError } = await supabaseAdmin
        .from("repair_tasks")
        .select(
          `
          id,
          task_number,
          device_id,
          issue_description,
          priority,
          status,
          service_provider_id,
          assigned_date,
          estimated_cost,
          actual_cost,
          work_started_at,
          work_completed_at,
          confirmed_at,
          notes,
          service_providers (
            id,
            name,
            email
          ),
          devices (
            location
          )
          `
        )
        .in("device_id", deviceIds)
        .order("assigned_date", { ascending: false })

      if (repairsError) {
        console.error("[v0] Error fetching repair tasks:", repairsError)
        return NextResponse.json(
          { error: "Failed to fetch repair tasks" },
          { status: 500 }
        )
      }

      repairsData = repairs || []
    }

    // Categorize repairs
    const regionalRepairs = repairsData.filter((r: any) => r.devices?.location === regionId)
    
    // Head office repairs - devices that belong to this region but are marked with repair_source = "head_office"
    const headOfficeRepairs = repairsData.filter(
      (r: any) => r.devices?.location === regionId && r.repair_source === "head_office"
    )

    // Local repairs - devices from this region with repair_source = "regional" or null
    const localRepairs = repairsData.filter(
      (r: any) => r.devices?.location === regionId && (!r.repair_source || r.repair_source === "regional")
    )

    let results: any = {}

    if (type === "regional" || type === "all") {
      results.regional = {
        count: localRepairs.length,
        repairs: localRepairs,
      }
    }

    if (type === "head_office" || type === "all") {
      results.headOffice = {
        count: headOfficeRepairs.length,
        repairs: headOfficeRepairs,
      }
    }

    if (type === "all") {
      results.all = {
        count: regionalRepairs.length,
        repairs: regionalRepairs,
      }
    } else if (!type || type === "all") {
      results.all = {
        count: regionalRepairs.length,
        repairs: regionalRepairs,
      }
    }

    return NextResponse.json({
      success: true,
      regionId,
      results,
    })
  } catch (error: any) {
    console.error("[v0] Error in regional repairs API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
