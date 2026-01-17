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

    console.log("[v0] API Store Items - location:", location, "canSeeAll:", canSeeAll)

    let query = supabaseAdmin
      .from("store_items")
      .select("*")
      .order("created_at", { ascending: false })

    if (!canSeeAll && location) {
      query = query.or(`location.eq.${location},location.eq.Central Stores`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error loading store items:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Loaded store items:", data?.length || 0)

    return NextResponse.json({ items: data || [] })
  } catch (error) {
    console.error("[v0] API Store Items error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Creating store item:", body)

    const { data, error } = await supabaseAdmin
      .from("store_items")
      .insert({
        name: body.name,
        category: body.category,
        quantity: body.quantity || 0,
        reorder_level: body.reorder_level || 0,
        unit: body.unit || "pcs",
        location: body.location,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating store item:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Created store item:", data)

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error("[v0] API Store Items POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
