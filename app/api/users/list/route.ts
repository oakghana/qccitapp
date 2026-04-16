import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "service-role-key-placeholder"
)

export async function GET() {
  try {
    console.log("[v0] Loading users from API...")

    const { data: users, error } = await supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[v0] Successfully fetched ${users?.length || 0} users`)

    return NextResponse.json({ users: users || [] })
  } catch (error: any) {
    console.error("[v0] Exception in users/list:", error.message)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
