import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key"
    )

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, location")
      .eq("role", "regional_it_head")
      .eq("is_active", true)
      .order("location", { ascending: true })

    if (error) {
      console.error("[regional-heads] fetch error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, heads: data || [] })
  } catch (error) {
    console.error("[regional-heads] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch regional heads" }, { status: 500 })
  }
}
