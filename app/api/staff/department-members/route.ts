import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get current user's department
    const { data: profile } = await supabase
      .from("profiles")
      .select("department")
      .eq("id", user.id)
      .single()

    if (!profile?.department) {
      return NextResponse.json({ staff: [] })
    }

    // Get all staff in the same department
    const { data: staff, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, username, department, role, is_approved, is_active, created_at")
      .eq("department", profile.department)
      .neq("id", user.id)
      .order("full_name")

    if (error) throw error

    return NextResponse.json({ success: true, staff: staff || [] })
  } catch (error) {
    console.error("[v0] Error fetching department members:", error)
    return NextResponse.json(
      { error: "Failed to fetch department members" },
      { status: 500 }
    )
  }
}
