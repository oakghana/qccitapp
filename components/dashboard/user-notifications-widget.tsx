"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Bell, Mail, AlertCircle, CheckCircle, Info } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface UserNotification {
  id: string
  message: string
  title: string
  type: string
  is_read: boolean
  created_at: string
  user_id: string
}

const typeIcons = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle,
  error: AlertCircle,
  email: Mail,
}

const typeColors = {
  info: "bg-blue-50 dark:bg-blue-950",
  warning: "bg-yellow-50 dark:bg-yellow-950",
  success: "bg-green-50 dark:bg-green-950",
  error: "bg-red-50 dark:bg-red-950",
  email: "bg-purple-50 dark:bg-purple-950",
}

export function UserNotificationsWidget() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!user?.id) return
    loadNotifications()
    // Subscribe to real-time changes
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) {
        console.error("Error loading notifications:", error)
        return
      }

      setNotifications(data || [])
      const unread = data?.filter(n => !n.is_read).length || 0
      setUnreadCount(unread)
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
      if (unreadIds.length === 0) return

      await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadIds)

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const handleViewAll = () => {
    router.push("/dashboard/notifications")
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </CardDescription>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-600">{unreadCount}</Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => {
              const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info
              const bgColor = typeColors[notification.type as keyof typeof typeColors] || typeColors.info

              return (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${bgColor} ${
                    !notification.is_read ? "border-primary/50" : "border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {notification.title && (
                            <h4 className="font-medium text-sm text-foreground line-clamp-1">
                              {notification.title}
                            </h4>
                          )}
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                        {!notification.is_read && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-2 mt-4 pt-3 border-t">
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAllAsRead} className="flex-1 text-xs">
              Mark all as read
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleViewAll} className="flex-1 text-xs">
            View all
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
