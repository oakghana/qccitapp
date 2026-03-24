import fs from "fs"
import path from "path"

const content = `import { NextResponse } from "next/server"
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
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify sender role
    const { data: sender, error: userError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", sentBy)
      .single()

    if (userError || !sender || !["admin", "it_head", "regional_it_head"].includes(sender.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Save the broadcast record
    const { data: broadcast, error: broadcastError } = await supabase
      .from("admin_notifications")
      .insert({
        title,
        message,
        target_role: targetRole,
        target_location_name: targetLocation || null,
        created_by: sentBy,
        sent_by: sentBy,
        created_by_name: sentByName,
        sent_by_name: sentByName,
        created_by_role: sender.role,
        notification_type: notificationType || "info",
        status: "sent",
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (broadcastError || !broadcast) {
      console.error("Broadcast insert error:", broadcastError)
      return NextResponse.json({ error: broadcastError?.message || "Failed to save broadcast" }, { status: 500 })
    }

    // Fetch all active users matching the target role
    let profileQuery = supabase
      .from("profiles")
      .select("id, full_name, email, location, role")
      .eq("is_active", true)

    if (targetRole !== "all") {
      profileQuery = profileQuery.eq("role", targetRole)
    }

    const { data: recipients } = await profileQuery

    if (recipients && recipients.length > 0) {
      const typeMap: Record<string, string> = {
        info: "info",
        warning: "warning",
        urgent: "error",
        maintenance: "warning",
      }

      // Fan out: insert one notification per user so they see it in their inbox
      await supabase.from("notifications").insert(
        recipients.map((r) => ({
          user_id: r.id,
          title,
          message,
          type: typeMap[notificationType] || "info",
          is_read: false,
          created_at: new Date().toISOString(),
        }))
      )

      // Track delivery
      await supabase.from("admin_notification_recipients").insert(
        recipients.map((r) => ({
          notification_id: broadcast.id,
          user_id: r.id,
          user_name: r.full_name || r.email,
          user_email: r.email,
          user_role: r.role,
          user_location: r.location || "",
          is_read: false,
          received_at: new Date().toISOString(),
        }))
      )
    }

    return NextResponse.json({
      success: true,
      notification: broadcast,
      recipientCount: recipients?.length || 0,
    })
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

    if (!userId || !userRole) {
      return NextResponse.json({ error: "Missing userId or userRole" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("admin_notifications")
      .select("id,title,message,notification_type,target_role,target_location_name,created_at,created_by_name,status,recipients_count")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: data || [] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
`

const filePath = path.resolve("app/api/service-tickets/notify/route.ts")
fs.writeFileSync(filePath, content, "utf8")
console.log("Successfully rewrote notify route at:", filePath)
console.log("File size:", fs.statSync(filePath).size, "bytes")
