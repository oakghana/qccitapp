import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceProviderId = searchParams.get("serviceProviderId")
    const status = searchParams.get("status")

    if (!serviceProviderId) {
      return NextResponse.json(
        { error: "Service provider ID is required" },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from("repair_requests")
      .select(
        `
        id,
        task_number,
        device_id,
        device_info,
        device_name,
        device_type,
        brand,
        model,
        serial_number,
        asset_tag,
        issue_description,
        description,
        priority,
        status,
        service_provider_id,
        service_provider_name,
        assigned_date,
        requested_date,
        estimated_cost,
        actual_cost,
        work_started_at,
        work_completed_at,
        estimated_completion,
        notes,
        location,
        requested_by,
        created_at,
        updated_at
        `
      )
      .eq("service_provider_id", serviceProviderId)
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching service provider repairs:", error)
      return NextResponse.json(
        { error: "Failed to fetch repair tasks" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      repairs: data || [],
    })
  } catch (error: any) {
    console.error("[v0] Error in service provider repairs API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
