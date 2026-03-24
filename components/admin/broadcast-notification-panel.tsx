'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useNotification } from '@/hooks/use-notification-sound'
import { Bell, Loader2, Send, AlertCircle, InfoIcon } from 'lucide-react'

interface AdminBroadcastPanelProps {
  currentUserId: string
  currentUserName: string
  currentUserRole: string
  locations?: Array<{ code: string; name: string }>
}

const ROLE_OPTIONS = [
  { value: 'it_staff', label: 'IT Staff' },
  { value: 'service_desk_staff', label: 'Service Desk Staff' },
  { value: 'service_desk_head', label: 'Service Desk Head' },
  { value: 'it_head', label: 'IT Head' },
  { value: 'staff', label: 'Regular Staff' },
  { value: 'user', label: 'All Users' },
]

const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Info', icon: '🔵' },
  { value: 'warning', label: 'Warning', icon: '⚠️' },
  { value: 'urgent', label: 'Urgent', icon: '🔴' },
  { value: 'maintenance', label: 'Maintenance', icon: '🔧' },
]

export const AdminBroadcastPanel: React.FC<AdminBroadcastPanelProps> = ({
  currentUserId,
  currentUserName,
  currentUserRole,
  locations = [],
}) => {
  const { toast } = useToast()
  const { showNotification } = useNotification()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sentNotifications, setSentNotifications] = useState<any[]>([])
  const [isAdminOnly] = useState(
    ["admin", "it_head", "regional_it_head"].includes(currentUserRole)
  )

  // Form states
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetRole, setTargetRole] = useState('service_desk_staff')
  const [targetLocation, setTargetLocation] = useState('')
  const [notificationType, setNotificationType] = useState('info')

  useEffect(() => {
    if (isAdminOnly) {
      fetchSentNotifications()
    }
  }, [isAdminOnly])

  const fetchSentNotifications = async () => {
    try {
      const response = await fetch(`/api/service-tickets/notify?userId=${currentUserId}&userRole=${currentUserRole}`)
      if (response.ok) {
        const result = await response.json()
        setSentNotifications(result.notifications || [])
      } else {
        console.error('Failed to fetch notifications:', response.statusText)
        setSentNotifications([])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setSentNotifications([])
    }
  }

  const handleSendNotification = async () => {
    // Validation
    if (!title.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a notification title',
        variant: 'destructive',
      })
      return
    }

    if (!message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter notification message',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/service-tickets/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          targetRole,
          targetLocation: targetLocation || null,
          sentBy: currentUserId,
          sentByName: currentUserName,
          notificationType,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send notification')
      }

      await showNotification({
        title: 'Broadcast Sent',
        description: result.message || `Notification sent to ${targetRole} users`,
        type: 'success',
        sound: true,
      })

      // Reset form
      setTitle('')
      setMessage('')
      setTargetRole('service_desk_staff')
      setTargetLocation('')
      setNotificationType('info')
      setDialogOpen(false)

      // Refresh notifications list
      fetchSentNotifications()
    } catch (error: any) {
      console.error("[v0] Broadcast send error:", error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to send notification',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAdminOnly) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Broadcast Panel Header */}
      <Card className="border-amber-200/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Broadcast Center
              </CardTitle>
              <CardDescription>
                Send notifications to IT staff, service desk, and users by role
              </CardDescription>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              <Send className="mr-2 h-4 w-4" />
              New Notification
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Recent Notifications */}
      {sentNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sentNotifications.slice(0, 10).map(notif => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                >
                  <div
                    className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      notif.notification_type === 'urgent'
                        ? 'bg-red-500'
                        : notif.notification_type === 'warning'
                          ? 'bg-amber-500'
                          : notif.notification_type === 'maintenance'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="inline-block px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {notif.target_role}
                      </span>
                      {notif.target_location_name && (
                        <span className="inline-block px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                          {notif.target_location_name}
                        </span>
                      )}
                      <span>{new Date(notif.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Broadcast Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Broadcast Notification</DialogTitle>
            <DialogDescription>
              Send notifications to users by role. All users with the selected role will receive this notification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Info Alert */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Notifications will display as modern animated toasts with sound on the recipient's dashboard.
              </p>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Notification Title</Label>
              <input
                id="title"
                type="text"
                placeholder="e.g., System Maintenance Notice"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your notification message..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
              />
            </div>

            {/* Notification Type */}
            <div>
              <Label htmlFor="notification-type">Notification Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {NOTIFICATION_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setNotificationType(type.value)}
                    className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                      notificationType === type.value
                        ? 'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-100'
                        : 'bg-background border-border hover:bg-secondary'
                    }`}
                  >
                    <span className="mr-2">{type.icon}</span>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Role */}
            <div>
              <Label htmlFor="target-role">Send To (Role)</Label>
              <select
                id="target-role"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLE_OPTIONS.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Location (Optional) */}
            {locations.length > 0 && (
              <div>
                <Label htmlFor="target-location">Target Location (Optional)</Label>
                <select
                  id="target-location"
                  value={targetLocation}
                  onChange={e => setTargetLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc.code} value={loc.code}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={isLoading}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Notification
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
