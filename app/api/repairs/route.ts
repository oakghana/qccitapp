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
    const location = searchParams.get("location")
    const canSeeAll = searchParams.get("canSeeAll") === "true"

    console.log("[v0] API Repair Requests - location:", location, "canSeeAll:", canSeeAll)

    let query = supabaseAdmin
      .from("repair_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (!canSeeAll && location) {
      query = query.or(`location.ilike.${location},location.ilike.%${location}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error loading repair requests:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Loaded repair requests:", data?.length || 0)

    return NextResponse.json({ repairs: data || [] })
  } catch (error) {
    console.error("[v0] API Repair Requests error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Creating repair request:", body)

    const { data, error } = await supabaseAdmin
      .from("repair_requests")
      .insert({
        device_id: body.device_id,
        device_name: body.device_name,
        description: body.description,
        priority: body.priority || "medium",
        status: "pending",
        location: body.location,
        requested_by: body.requested_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating repair request:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Created repair request:", data)

    return NextResponse.json({ repair: data })
  } catch (error) {
    console.error("[v0] API Repair Requests POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
