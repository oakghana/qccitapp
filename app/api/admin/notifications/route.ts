import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get all notifications with user info
    const { data: notifications, error } = await supabaseAdmin
      .from("notifications")
      .select(
        `
        id,
        user_id,
        title,
        message,
        type,
        category,
        is_read,
        read_at,
        created_at,
        profiles:user_id (
          id,
          full_name,
          email,
          role
        )
      `
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching notifications:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by category for admin dashboard
    const grouped = (notifications || []).reduce(
      (acc: any, notif: any) => {
        const category = notif.category || "general"
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(notif)
        return acc
      },
      {} as Record<string, any[]>
    )

    // Calculate stats
    const stats = {
      total: notifications?.length || 0,
      read: (notifications || []).filter((n) => n.is_read).length,
      unread: (notifications || []).filter((n) => !n.is_read).length,
      byCategory: Object.entries(grouped).reduce(
        (acc: any, [cat, notifs]: [string, any]) => {
          acc[cat] = {
            total: (notifs as any[]).length,
            read: (notifs as any[]).filter((n) => n.is_read).length,
            unread: (notifs as any[]).filter((n) => !n.is_read).length,
          }
          return acc
        },
        {} as Record<string, any>
      ),
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      grouped,
      stats,
    })
  } catch (error) {
    console.error("[v0] Error in admin notifications query:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}
