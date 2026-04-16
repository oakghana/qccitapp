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
      return NextResponse.json({
        pending_count: 0,
        approved_this_month: 0,
        recent: [],
      })
    }

    // Get pending department head requisitions
    const { data: pending } = await supabase
      .from("it_equipment_requisitions")
      .select("id, requisition_number, staff_name, items_required, status, created_at")
      .eq("department_name", profile.department)
      .eq("status", "pending_department_head")
      .order("created_at", { ascending: false })
      .limit(10)

    // Count approved this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const { data: approved, count: approvedCount } = await supabase
      .from("it_equipment_requisitions")
      .select("id", { count: "exact" })
      .eq("department_name", profile.department)
      .eq("status", "approved_by_department_head")
      .gte("department_head_approved_at", startOfMonth.toISOString())

    return NextResponse.json({
      success: true,
      pending_count: pending?.length || 0,
      approved_this_month: approvedCount || 0,
      recent: pending || [],
    })
  } catch (error) {
    console.error("[v0] Error fetching department requisitions:", error)
    return NextResponse.json(
      { error: "Failed to fetch requisitions" },
      { status: 500 }
    )
  }
}
