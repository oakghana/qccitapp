'use client'

import { AdminBroadcastPanel } from '@/components/admin/broadcast-notification-panel'
import { useAuth } from '@/lib/auth-context'

export default function BroadcastNotificationsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Broadcast Notifications</h1>
        <p className="text-muted-foreground mt-2">
          Send notifications to IT staff and users about service delays and important updates
        </p>
      </div>
      <AdminBroadcastPanel
        currentUserId={user?.id || ''}
        currentUserName={user?.email || 'Unknown'}
        currentUserRole={user?.role || 'user'}
        locations={[]}
      />
    </div>
  )
}
