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
    const includeRoles = searchParams.get("roles") || "it_staff,it_technician,service_desk_head,regional_it_head"
    const onlyActive = searchParams.get("onlyActive") !== "false"

    const roles = includeRoles.split(",").map(r => r.trim()).filter(Boolean)

    console.log("[v0] API Staff Members - roles:", roles, "onlyActive:", onlyActive)

    // Fetch staff members from profiles table
    let query = supabaseAdmin
      .from("profiles")
      .select("id, full_name, name, email, role, status, location")
      .in("role", roles)

    if (onlyActive) {
      query = query.eq("status", "active")
    }

    const { data, error } = await query.order("full_name", { ascending: true })

    if (error) {
      console.error("[v0] Error loading staff members:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Staff members loaded:", data?.length || 0)

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("[v0] Unexpected error in staff members API:", error)
    return NextResponse.json(
      { error: "Failed to load staff members" },
      { status: 500 }
    )
  }
}
