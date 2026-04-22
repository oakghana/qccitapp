import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// POST /api/notifications/send — Send a notification to a specific user (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
    )

    const body = await request.json()
    const { user_id, title, message, type, category, reference_type, reference_id } = body

    if (!user_id || !title || !message) {
      return NextResponse.json({ error: "user_id, title, and message are required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id,
        title,
        message,
        type: type || "info",
        category: category || "general",
        is_read: false,
        read_at: null,
        reference_type: reference_type || null,
        reference_id: reference_id || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, notification: data })
  } catch (error) {
    console.error("[notifications/send] POST error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
