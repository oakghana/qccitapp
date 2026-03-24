import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Maps broadcast target_role values to the actual role values stored in profiles
const ROLE_MAP: Record<string, string[]> = {
  it_staff:           ["it_staff"],
  service_desk_staff: ["service_desk_staff"],
  service_desk_head:  ["service_desk_head"],
  it_head:            ["it_head", "regional_it_head"],
  staff:              ["staff"],
  user:               ["admin", "it_head", "regional_it_head", "it_staff",
                       "service_desk_staff", "service_desk_head", "staff",
                       "user", "it_store_head"],
}

const ALLOWED_SENDER_ROLES = ["admin", "it_head", "regional_it_head"]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      message,
      targetRole,
      targetLocation,
      sentBy,
      sentByName,
      notificationType = "info",
    } = body

    if (!title?.trim() || !message?.trim() || !targetRole) {
      return NextResponse.json({ error: "title, message and targetRole are required" }, { status: 400 })
    }

    // Verify the sender exists and has permission
    const { data: senderProfile } = await supabaseAdmin
      .from("profiles")
      .select("role, full_name")
      .eq("id", sentBy)
      .single()

    if (!senderProfile || !ALLOWED_SENDER_ROLES.includes(senderProfile.role)) {
      return NextResponse.json(
        { error: "Unauthorized: Only admins and IT heads can send broadcast notifications" },
        { status: 403 }
      )
    }

    // 1. Save the broadcast record
    const { data: broadcast, error: broadcastError } = await supabaseAdmin
      .from("admin_notifications")
      .insert({
        title: title.trim(),
        message: message.trim(),
        target_role: targetRole,
        target_location_name: targetLocation || null,
        notification_type: notificationType,
        sent_by: sentBy || null,
        sent_by_name: sentByName || senderProfile.full_name || "Admin",
        created_by: sentBy || null,
        created_by_name: sentByName || senderProfile.full_name || "Admin",
        created_by_role: senderProfile.role,
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (broadcastError) {
      return NextResponse.json({ error: broadcastError.message }, { status: 500 })
    }

    // 2. Resolve which profile roles should receive this broadcast
    const rolesToNotify = ROLE_MAP[targetRole] ?? [targetRole]

    // 3. Fetch all active matching users from profiles
    let profileQuery = supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, role, location")
      .in("role", rolesToNotify)
      .eq("is_active", true)

    if (targetLocation) {
      profileQuery = profileQuery.ilike("location", `%${targetLocation}%`)
    }

    const { data: profiles, error: profileError } = await profileQuery

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const recipients = profiles ?? []

    if (recipients.length === 0) {
      return NextResponse.json({
        success: true,
        broadcast,
        recipientsCount: 0,
        message: "Broadcast saved but no active users found for the selected role.",
      })
    }

    // 4. Fan out a row into `notifications` for every matched user
    //    This is what the dashboard widget and inbox page read from.
    const notificationRows = recipients.map((p) => ({
      user_id: p.id,
      title: title.trim(),
      message: message.trim(),
      type: notificationType === "urgent" ? "warning" : notificationType,
      is_read: false,
    }))

    const { error: notifError } = await supabaseAdmin
      .from("notifications")
      .insert(notificationRows)

    if (notifError) {
      return NextResponse.json({ error: notifError.message }, { status: 500 })
    }

    // 5. Track recipients in admin_notification_recipients for admin reporting
    const recipientRows = recipients.map((p) => ({
      notification_id: broadcast.id,
      user_id: p.id,
      user_name: p.full_name || p.email,
      user_email: p.email,
      user_role: p.role,
      user_location: p.location || null,
      is_read: false,
      received_at: new Date().toISOString(),
    }))

    await supabaseAdmin.from("admin_notification_recipients").insert(recipientRows)

    // 6. Update the recipients_count on the broadcast record
    await supabaseAdmin
      .from("admin_notifications")
      .update({ recipients_count: recipients.length })
      .eq("id", broadcast.id)

    return NextResponse.json({
      success: true,
      broadcast,
      recipientsCount: recipients.length,
      message: `Notification delivered to ${recipients.length} user${recipients.length !== 1 ? "s" : ""}.`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send notification" }, { status: 500 })
  }
}

// GET – returns sent broadcast history for the admin panel history list
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userRole = searchParams.get("userRole") || ""

    if (!ALLOWED_SENDER_ROLES.includes(userRole)) {
      return NextResponse.json({ notifications: [] })
    }

    const { data, error } = await supabaseAdmin
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch notifications" }, { status: 500 })
  }
}
