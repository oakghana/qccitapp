import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const location = searchParams.get("location")

    // Fetch all available repairs (unassigned or new)
    let query = supabaseAdmin
      .from("repair_requests")
      .select(
        `
        id,
        task_number,
        device_id,
        device_name,
        issue_description,
        priority,
        status,
        service_provider_id,
        service_provider_name,
        requested_date,
        estimated_cost,
        location,
        created_at,
        devices (
          id,
          device_name,
          device_type,
          brand,
          model,
          serial_number,
          asset_tag,
          status,
          location,
          assigned_to
        )
        `
      )
      // Show unassigned repairs or those just created
      .in("status", ["new", "pending", "assigned"])
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (location && location !== "all") {
      query = query.eq("location", location)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching all repairs:", error)
      return NextResponse.json(
        { error: "Failed to fetch repairs" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      repairs: data || [],
    })
  } catch (error: any) {
    console.error("[v0] Error in all repairs API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
