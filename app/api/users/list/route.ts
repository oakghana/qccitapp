import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("[v0] Loading users from API...")

    const supabase = await createServerClient()

    // Fetch all users using service role (bypasses RLS)
    const { data: users, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

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
