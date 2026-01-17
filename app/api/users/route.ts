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
    const role = searchParams.get("role")
    const location = searchParams.get("location")

    console.log("[v0] API Users GET - role filter:", role, "location filter:", location)

    let query = supabaseAdmin
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true })

    // Filter by role if provided
    if (role) {
      query = query.eq("role", role)
    }

    // Filter by location if provided
    if (location) {
      query = query.ilike("location", `%${location}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Loaded users:", data?.length || 0)

    return NextResponse.json({ users: data || [] })
  } catch (error) {
    console.error("[v0] API Users GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
