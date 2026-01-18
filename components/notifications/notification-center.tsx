"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { NotificationTemplates } from "./notification-templates"
import { SendNotificationForm } from "./send-notification-form"
import { createClient } from "@/lib/supabase/client" // Fixed import path to use correct Supabase client location
import {
  Mail,
  MessageSquare,
  Bell,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  Users,
  Building,
} from "lucide-react"

interface Notification {
  id: string
  type: "email" | "sms"
  recipient: string
  recipientType: "service_provider" | "user" | "it_head"
  subject: string
  message: string
  status: "sent" | "delivered" | "read" | "failed"
  sentDate: string
  relatedRequest?: string
  priority: "low" | "medium" | "high"
  attachments?: string[]
}

const statusColors = {
  sent: "secondary",
  delivered: "default",
  read: "default",
  failed: "destructive",
} as const

const priorityColors = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
} as const

const typeIcons = {
  email: Mail,
  sms: MessageSquare,
}

const recipientTypeIcons = {
  service_provider: Building,
  user: Users,
  it_head: Users,
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sendNotificationOpen, setSendNotificationOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading notifications:", error)
        setNotifications([])
        return
      }

      setNotifications(data || [])
    } catch (error) {
      console.error("Error loading notifications:", error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.relatedRequest?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSendNotification = (newNotification: Omit<Notification, "id" | "sentDate" | "status">) => {
    const notification: Notification = {
      ...newNotification,
      id: `NOT-2024-${String(notifications.length + 1).padStart(3, "0")}`,
      sentDate: new Date().toISOString(),
      status: "sent",
    }
    setNotifications([notification, ...notifications])
    setSendNotificationOpen(false)
  }

  const emailNotifications = filteredNotifications.filter((n) => n.type === "email")
  const smsNotifications = filteredNotifications.filter((n) => n.type === "sms")
  const serviceProviderNotifications = filteredNotifications.filter((n) => n.recipientType === "service_provider")

  const stats = {
    total: notifications.length,
    sent: notifications.filter((n) => n.status === "sent").length,
    delivered: notifications.filter((n) => n.status === "delivered").length,
    failed: notifications.filter((n) => n.status === "failed").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notification Center</h1>
          <p className="text-muted-foreground">Manage email and SMS communications</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Bell className="mr-2 h-4 w-4" />
                Templates
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Notification Templates</DialogTitle>
                <DialogDescription>Manage email and SMS templates for different scenarios</DialogDescription>
              </DialogHeader>
              <NotificationTemplates />
            </DialogContent>
          </Dialog>
          <Dialog open={sendNotificationOpen} onOpenChange={setSendNotificationOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Notification</DialogTitle>
                <DialogDescription>Send email or SMS notification manually</DialogDescription>
              </DialogHeader>
              <SendNotificationForm onSubmit={handleSendNotification} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">Delivery failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by recipient, subject, or request ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({filteredNotifications.length})</TabsTrigger>
          <TabsTrigger value="email">Email ({emailNotifications.length})</TabsTrigger>
          <TabsTrigger value="sms">SMS ({smsNotifications.length})</TabsTrigger>
          <TabsTrigger value="providers">Service Providers ({serviceProviderNotifications.length})</TabsTrigger>
        </TabsList>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading notifications...</CardContent>
          </Card>
        ) : (
          <>
            <TabsContent value="all" className="space-y-4">
              <NotificationList notifications={filteredNotifications} />
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <NotificationList notifications={emailNotifications} />
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <NotificationList notifications={smsNotifications} />
            </TabsContent>

            <TabsContent value="providers" className="space-y-4">
              <NotificationList notifications={serviceProviderNotifications} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}

interface NotificationListProps {
  notifications: Notification[]
}

function NotificationList({ notifications }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No notifications found</h3>
          <p className="text-muted-foreground text-center">No notifications match your current criteria.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        const TypeIcon = typeIcons[notification.type]
        const RecipientIcon = recipientTypeIcons[notification.recipientType]

        return (
          <Card key={notification.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TypeIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base">{notification.subject}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <RecipientIcon className="h-3 w-3" />
                      <span>{notification.recipient}</span>
                      {notification.relatedRequest && (
                        <>
                          <span>•</span>
                          <span>{notification.relatedRequest}</span>
                        </>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={priorityColors[notification.priority]}>
                    {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                  </Badge>
                  <Badge variant={statusColors[notification.status]}>
                    {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-foreground">{notification.message}</p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-muted-foreground">
                      Sent: {new Date(notification.sentDate).toLocaleString()}
                    </span>
                    {notification.attachments && notification.attachments.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {notification.attachments.length} attachment{notification.attachments.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {notification.type.toUpperCase()}
                  </Badge>
                </div>

                {notification.attachments && notification.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Attachments:</p>
                    <div className="flex flex-wrap gap-1">
                      {notification.attachments.map((attachment, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {attachment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
