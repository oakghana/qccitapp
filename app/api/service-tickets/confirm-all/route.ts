import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userName, userRole } = body

    // only admins/heads may perform bulk confirm
    if (!userRole || !["admin", "it_head"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const nowIso = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from("service_tickets")
      .update({
        status: "resolved",
        resolved_at: nowIso,
        completion_confirmed: true,
        completion_confirmed_at: nowIso,
        completion_confirmed_by: userId || null,
        completion_confirmed_by_name: userName || "Admin",
        updated_at: nowIso,
      })
      .eq("status", "awaiting_confirmation")

    if (error) {
      console.error("[v0] Error confirming all tickets:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: data?.length || 0 })
  } catch (err) {
    console.error("[v0] confirm-all error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
