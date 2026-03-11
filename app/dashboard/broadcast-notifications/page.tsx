'use client'

import { BroadcastNotificationPanel } from '@/components/admin/broadcast-notification-panel'

export default function BroadcastNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Broadcast Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Send notifications to IT staff and users about service delays and important updates
        </p>
      </div>
      <BroadcastNotificationPanel />
    </div>
  )
}
