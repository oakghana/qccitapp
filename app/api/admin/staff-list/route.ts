import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get all staff members
    const { data: staff, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name as name, email, department")
      .eq("role", "staff")
      .eq("is_active", true)

    if (error) throw error

    // Check which staff have department heads assigned
    const staffWithLinking = await Promise.all(
      (staff || []).map(async (member: any) => {
        // Check if there's a department_head_links entry for this staff
        const { data: link } = await supabaseAdmin
          .from("department_head_links")
          .select("*")
          .eq("staff_id", member.id)
          .single()

        return {
          ...member,
          linked: !!link,
        }
      })
    )

    return NextResponse.json({ staff: staffWithLinking })
  } catch (error) {
    console.error("[v0] Error fetching staff list:", error)
    return NextResponse.json(
      { error: "Failed to fetch staff list" },
      { status: 500 }
    )
  }
}
