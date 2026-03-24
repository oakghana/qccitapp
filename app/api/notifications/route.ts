import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const body = await request.json()
    const {
      userId,
      title,
      message,
      type = "info", // info, warning, success, error, email
    } = body

    // Validate required fields
    if (!userId || !message) {
      return NextResponse.json(
        { error: "userId and message are required" },
        { status: 400 }
      )
    }

    // Insert notification into database
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title: title || "",
        message,
        type,
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating notification:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notification: data,
      message: "Notification created successfully",
    })
  } catch (error: any) {
    console.error("Error in notification creation:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notifications:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const unreadCount = data.filter(n => !n.is_read).length

    return NextResponse.json({
      success: true,
      notifications: data,
      unreadCount,
    })
  } catch (error: any) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { notificationIds, userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    // If notificationIds provided, mark only those as read
    if (notificationIds && notificationIds.length > 0) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", notificationIds)

      if (error) {
        console.error("Error updating notifications:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Mark all as read for this user
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false)

      if (error) {
        console.error("Error updating notifications:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
    })
  } catch (error: any) {
    console.error("Error updating notifications:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { notificationIds, userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    if (notificationIds && notificationIds.length > 0) {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .in("id", notificationIds)

      if (error) {
        console.error("Error deleting notifications:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Delete all for this user
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId)

      if (error) {
        console.error("Error deleting notifications:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Notifications deleted successfully",
    })
  } catch (error: any) {
    console.error("Error deleting notifications:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
