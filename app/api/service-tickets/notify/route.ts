import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, message, targetRole, targetLocation, sentBy, sentByName, notificationType } = body

    if (!title || !message || !targetRole || !sentBy) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Only admins can send broadcast notifications
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", sentBy)
      .single()

    if (userError || !user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: Only admins can send notifications" },
        { status: 403 }
      )
    }

    // Insert admin notification
    const { data, error } = await supabase
      .from("admin_notifications")
      .insert({
        title: title,
        message: message,
        target_role: targetRole,
        target_location: targetLocation,
        sent_by: sentBy,
        sent_by_name: sentByName,
        notification_type: notificationType,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating notification:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the action
    await supabase.from("audit_logs").insert({
      action: "admin_notification_sent",
      table_name: "admin_notifications",
      record_id: data.id,
      user_id: sentBy,
      user_name: sentByName,
      details: {
        target_role: targetRole,
        target_location: targetLocation,
        notification_type: notificationType,
      },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, notification: data })
  } catch (error) {
    console.error("Error in broadcast endpoint:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const userRole = searchParams.get("userRole")
    const userLocation = searchParams.get("userLocation")

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: "Missing userId or userRole parameter" },
        { status: 400 }
      )
    }

    // Fetch notifications targeted to this user's role and location
    let query = supabase
      .from("admin_notifications")
      .select("*")
      .eq("target_role", userRole)
      .order("created_at", { ascending: false })

    // If location is provided, also include location-specific notifications
    if (userLocation) {
      query = query.or(`target_location.eq.${userLocation},target_location.is.null`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching notifications:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: data })
  } catch (error) {
    console.error("Error in get notifications endpoint:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
