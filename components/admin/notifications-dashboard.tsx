"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCircle, Clock, Search, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NotificationWithUser {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  category: string
  is_read: boolean
  read_at: string | null
  created_at: string
  profiles: {
    id: string
    full_name: string
    email: string
    role: string
  }
}

interface Stats {
  total: number
  read: number
  unread: number
  byCategory: Record<string, { total: number; read: number; unread: number }>
}

export function AdminNotificationsDashboard() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<NotificationWithUser[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 0,
    read: 0,
    unread: 0,
    byCategory: {},
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/notifications")
      if (!response.ok) throw new Error("Failed to fetch notifications")

      const data = await response.json()
      setNotifications(data.notifications || [])
      setStats(data.stats || {})
    } catch (error) {
      console.error("[v0] Error loading notifications:", error)
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = notifications
    .filter((n) => selectedCategory === "all" || n.category === selectedCategory)
    .filter(
      (n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

  const categories = Object.keys(stats.byCategory || {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notification Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor notification delivery and read status</p>
        </div>
        <Button onClick={loadNotifications} disabled={loading} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.read}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? `${Math.round((stats.read / stats.total) * 100)}%` : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unread}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? `${Math.round((stats.unread / stats.total) * 100)}%` : "0%"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Badge variant="secondary">{categories.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {categories.slice(0, 3).map((cat) => (
                <div key={cat} className="text-xs text-muted-foreground flex justify-between">
                  <span>{cat}</span>
                  <span className="font-medium">{stats.byCategory[cat]?.total}</span>
                </div>
              ))}
              {categories.length > 3 && <div className="text-xs text-muted-foreground">+{categories.length - 3} more</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
            <CardDescription>Notification delivery status by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {categories.map((cat) => (
                <div key={cat} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm capitalize">{cat}</span>
                    <Badge>{stats.byCategory[cat]?.total || 0}</Badge>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>{stats.byCategory[cat]?.read || 0} read</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-yellow-600" />
                      <span>{stats.byCategory[cat]?.unread || 0} unread</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-green-600 h-1 rounded-full"
                      style={{
                        width: `${((stats.byCategory[cat]?.read || 0) / (stats.byCategory[cat]?.total || 1)) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Details</CardTitle>
          <CardDescription>View individual notification read status and recipient info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, message, user name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {categories.length > 0 && (
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="flex flex-wrap gap-1">
                <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger key={cat} value={cat}>
                    {cat} ({stats.byCategory[cat]?.total || 0})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No notifications found</div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    notif.is_read ? "bg-gray-50 dark:bg-gray-900/50" : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{notif.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {notif.type}
                        </Badge>
                        <Badge
                          variant={notif.is_read ? "secondary" : "default"}
                          className="text-xs"
                        >
                          {notif.is_read ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Read
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              Unread
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{notif.message}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>User: {notif.profiles.full_name}</span>
                        <span>•</span>
                        <span>{notif.profiles.email}</span>
                        <span>•</span>
                        <span>Role: {notif.profiles.role}</span>
                        <span>•</span>
                        <span>Sent: {new Date(notif.created_at).toLocaleString()}</span>
                        {notif.is_read && (
                          <>
                            <span>•</span>
                            <span>Read: {new Date(notif.read_at!).toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
