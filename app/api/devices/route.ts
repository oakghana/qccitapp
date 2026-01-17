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
    const canSeeAll = searchParams.get("canSeeAll") === "true"

    console.log("[v0] API Devices - location:", location, "canSeeAll:", canSeeAll)

    let query = supabase
      .from("devices")
      .select("*")
      .order("created_at", { ascending: false })

    // Apply location filter if user can't see all locations
    if (!canSeeAll && location) {
      // Use case-insensitive matching with ilike
      query = query.or(`location.ilike.${location},location.ilike.%${location}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error loading devices:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Loaded devices:", data?.length)
    return NextResponse.json(data || [])
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
