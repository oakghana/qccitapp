"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { Bell, Trash2, CheckCircle, AlertCircle, Info, Mail, Search } from "lucide-react"

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

const typeBadgeColors = {
  info: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-100",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-100",
  success: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-100",
  error: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-100",
  email: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-100",
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const res = await fetch(`/api/notifications?userId=${user.id}`)
      const json = await res.json()
      if (!res.ok) {
        console.error("[v0] Error fetching notifications:", json.error)
        return
      }
      setNotifications(json.notifications ?? [])
    } catch (err) {
      console.error("[v0] Notifications fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    loadNotifications()
    // Poll every 30 seconds to pick up new broadcasts
    const interval = setInterval(loadNotifications, 30_000)
    return () => clearInterval(interval)
  }, [user?.id, loadNotifications])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, notificationIds: [notificationId] }),
      })
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error("Error marking all as read:", err)
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, notificationIds: [notificationId] }),
      })
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (err) {
      console.error("Error deleting notification:", err)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm("Are you sure you want to delete all notifications?")) return
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      })
      setNotifications([])
    } catch (err) {
      console.error("Error deleting all notifications:", err)
    }
  }

  const filteredNotifications = notifications
    .filter(n => {
      if (filter === "unread") return !n.is_read
      if (filter === "read") return n.is_read
      return true
    })
    .filter(n =>
      n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message?.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const unreadCount = notifications.filter(n => !n.is_read).length
  const readCount = notifications.filter(n => n.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground">Manage your messages and updates</p>
        </div>
        {notifications.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear all
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Badge className="bg-red-600">{unreadCount}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting your attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readCount}</div>
            <p className="text-xs text-muted-foreground">Reviewed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "unread", "read"].map(f => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f as typeof filter)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading notifications...
          </CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">No notifications</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? "No notifications match your search"
                : filter === "unread"
                ? "All caught up! No unread messages"
                : "No notifications found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(notification => {
            const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info
            const badgeColor =
              typeBadgeColors[notification.type as keyof typeof typeBadgeColors] || typeBadgeColors.info

            return (
              <Card
                key={notification.id}
                className={`transition-colors ${!notification.is_read ? "border-primary/50 bg-primary/5" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          {notification.title && (
                            <h3 className="font-semibold text-foreground">{notification.title}</h3>
                          )}
                          <p className="text-sm text-foreground/80 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.is_read && (
                            <Badge variant="default" className="bg-blue-600">New</Badge>
                          )}
                          <Badge className={badgeColor}>{notification.type}</Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                        <div className="flex gap-2">
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              Mark as read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

