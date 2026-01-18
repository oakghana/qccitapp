import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get("location")
    const regionId = searchParams.get("regionId")
    const canSeeAll = searchParams.get("canSeeAll") === "true"

    console.log("[v0] API Devices - location:", location, "canSeeAll:", canSeeAll)

    let query = supabase
      .from("devices")
      .select("*")
      .order("created_at", { ascending: false })

    // Apply location or region filter if user can't see all locations
    if (!canSeeAll) {
      if (regionId) {
        // Filter by region_id OR Central Stores
        query = query.or(`region_id.eq.${regionId},location.eq.Central Stores`)
      } else if (location) {
        // Use case-insensitive matching with ilike for location names
        query = query.or(`location.ilike.${location},location.ilike.%${location}%`)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error loading devices:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Loaded devices:", data?.length)
    return NextResponse.json({ devices: data || [], count: data?.length || 0 })
  } catch (error: any) {
    console.error("[v0] Error in devices API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log("[v0] Creating device:", body)

    const { data, error } = await supabase
      .from("devices")
      .insert([{
        device_type: body.device_type,
        brand: body.brand,
        model: body.model,
        serial_number: body.serial_number,
        location: body.location,
        region_id: body.region_id || null,
        district_id: body.district_id || null,
        assigned_to: body.assigned_to || null,
        status: body.status || "active",
        purchase_date: body.purchase_date || null,
        warranty_expiry: body.warranty_expiry || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating device:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Device created:", data)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error in devices API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")

    // Support JSON body as well
    let bodyId = id
    try {
      const body = await request.json().catch(() => null)
      if (!bodyId && body && body.id) bodyId = body.id
    } catch (e) {
      // ignore
    }

    if (!bodyId) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 })
    }

    console.log("[v0] Deleting device:", bodyId)

    const { data, error } = await supabase.from("devices").delete().eq("id", bodyId).select()

    if (error) {
      console.error("[v0] Error deleting device:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deleted: data })
  } catch (error: any) {
    console.error("[v0] Error in devices DELETE:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
