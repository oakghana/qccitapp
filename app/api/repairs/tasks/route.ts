import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceProviderId = searchParams.get("service_provider_id")
    const status = searchParams.get("status")

    console.log("[v0] API Repair Tasks - service_provider_id:", serviceProviderId, "status:", status)

    let query = supabaseAdmin
      .from("repair_tasks")
      .select("*")
      .order("assigned_date", { ascending: false })

    if (serviceProviderId) {
      query = query.eq("service_provider_id", serviceProviderId)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      // Table may not exist yet
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log("[v0] repair_tasks table not yet created")
        return NextResponse.json({ tasks: [], message: "Table not yet created" })
      }
      console.error("[v0] Error loading repair tasks:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Loaded repair tasks:", data?.length || 0)

    return NextResponse.json({ tasks: data || [] })
  } catch (error) {
    console.error("[v0] API Repair Tasks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Creating repair task:", body)

    const { data, error } = await supabaseAdmin
      .from("repair_tasks")
      .insert({
        repair_request_id: body.repair_request_id,
        device_id: body.device_id,
        device_info: body.device_info,
        service_provider_id: body.service_provider_id,
        service_provider_name: body.service_provider_name,
        issue_description: body.issue_description,
        priority: body.priority || "medium",
        status: "assigned",
        assigned_by: body.assigned_by,
        assigned_by_name: body.assigned_by_name,
        location: body.location,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating repair task:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Created repair task:", data)

    return NextResponse.json({ task: data })
  } catch (error) {
    console.error("[v0] API Repair Tasks POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    console.log("[v0] Updating repair task:", id, updates)

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from("repair_tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating repair task:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Updated repair task:", data)

    return NextResponse.json({ task: data })
  } catch (error) {
    console.error("[v0] API Repair Tasks PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
