"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates"
import { createClient } from "@/lib/supabase/client"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
  related_id?: string
}

interface NotificationBellProps {
  userId: string
  userRole: string
}

export function NotificationBell({ userId, userRole }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPanel, setShowPanel] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  // Load initial notifications
  useEffect(() => {
    loadNotifications()
  }, [userId])

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(
          `recipient_id.eq.${userId},recipient_type.eq.${userRole},recipient_id.eq.admin`
        )
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("[v0] Error loading notifications:", error)
        return
      }

      setNotifications(data || [])
      setUnreadCount((data || []).filter((n) => !n.read).length)
    } catch (err) {
      console.error("[v0] Error in loadNotifications:", err)
    }
  }

  // Set up realtime listener for new notifications
  useRealtimeUpdates({
    table: "notifications",
    onInsert: (data) => {
      console.log("[v0] New notification received:", data)
      if (
        data.recipient_id === userId ||
        data.recipient_type === userRole ||
        data.recipient_id === "admin"
      ) {
        setNotifications((prev) => [data, ...prev.slice(0, 9)])
        setUnreadCount((prev) => prev + 1)
      }
    },
    onUpdate: (data) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === data.id ? data : n))
      )
      if (data.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    },
  })

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id)

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error("[v0] Error marking notification as read:", err)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await supabase.from("notifications").delete().eq("id", id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error("[v0] Error deleting notification:", err)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowPanel(!showPanel)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {showPanel && (
        <Card className="absolute right-0 top-12 w-96 max-h-96 overflow-hidden z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notifications</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No notifications yet
              </p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notif.read
                      ? "bg-muted border-muted-foreground/20 hover:bg-muted/80"
                      : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/40"
                  }`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notif.id)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
