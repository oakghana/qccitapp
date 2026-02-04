# 🔧 Developer Guide: Adding Notifications

## Quick Start

### 1. Use the Notification Hook
```typescript
import { useNotifications } from "@/lib/notification-context"

export function MyComponent() {
  const { addNotification } = useNotifications()

  const handleAction = () => {
    addNotification({
      title: "Action Completed",
      message: "Your action was successful",
      type: "success",
      priority: "medium",
      actionUrl: "/dashboard",
      actionLabel: "View Details"
    })
  }

  return <button onClick={handleAction}>Do Something</button>
}
```

### 2. Notification Types
```typescript
type: "success" | "error" | "warning" | "info"
```

### 3. Priority Levels
```typescript
priority: "low" | "medium" | "high" | "urgent"
```

## Adding Real-time Subscriptions

### Example: Custom Ticket Subscription
```typescript
import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/lib/notification-context"
import { supabase } from "@/lib/supabase"

export function useCustomTicketNotifications() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()

  useEffect(() => {
    if (!user?.id) return

    // Create channel
    const channel = supabase
      .channel(`my_tickets:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "service_tickets",
          filter: `assigned_to=eq.${user.id}`,
        },
        (payload) => {
          const ticket = payload.new as any
          
          // Trigger notification
          addNotification({
            title: "Ticket Updated",
            message: `${ticket.subject} - Status: ${ticket.status}`,
            type: "info",
            priority: "medium",
            actionUrl: `/dashboard/tickets/${ticket.id}`,
            actionLabel: "View Ticket",
          })
        },
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, addNotification])
}
```

## Notification Configuration

### Full Notification Object
```typescript
interface Notification {
  id: string                              // Auto-generated
  title: string                           // Notification title
  message: string                         // Detail message
  type: "info" | "success" | "warning" | "error"
  timestamp: Date                         // Auto-generated
  isRead: boolean                         // Auto-generated
  actionUrl?: string                      // Link when clicking action
  actionLabel?: string                    // Button text
  userId?: string                         // Target user ID
  priority: "low" | "medium" | "high" | "urgent"
}
```

## Common Scenarios

### Scenario 1: Task Assignment
```typescript
addNotification({
  title: "🎯 New Task Assigned",
  message: `"Device Repair" - HIGH Priority`,
  type: "info",
  priority: "high",
  actionUrl: "/dashboard/assigned-tasks",
  actionLabel: "View Task",
})
```

### Scenario 2: Task Completion
```typescript
addNotification({
  title: "✅ Task Completed",
  message: "Your support request has been resolved",
  type: "success",
  priority: "medium",
  actionUrl: "/dashboard/my-tickets",
  actionLabel: "View Details",
})
```

### Scenario 3: Error Alert
```typescript
addNotification({
  title: "❌ Error Occurred",
  message: "Failed to process your request. Please try again.",
  type: "error",
  priority: "urgent",
  actionUrl: "/dashboard/help",
  actionLabel: "Get Help",
})
```

### Scenario 4: Status Update
```typescript
addNotification({
  title: "📋 Status Update",
  message: `Ticket moved to "In Progress"`,
  type: "info",
  priority: "medium",
  actionUrl: `/dashboard/tickets/${ticketId}`,
  actionLabel: "View Status",
})
```

## Advanced: Batch Notifications

```typescript
const notificationBatch = [
  {
    title: "Task 1 Complete",
    message: "First task finished",
    type: "success" as const,
    priority: "low" as const,
  },
  {
    title: "Task 2 Complete",
    message: "Second task finished",
    type: "success" as const,
    priority: "low" as const,
  },
]

// Send them with a delay
notificationBatch.forEach((notif, index) => {
  setTimeout(() => {
    addNotification(notif)
  }, index * 1000) // 1 second apart
})
```

## Integration Points

### 1. API Routes
Add notifications when API operations complete:
```typescript
// app/api/service-tickets/route.ts
export async function POST(request: NextRequest) {
  // ... create ticket
  
  // Trigger notification for IT staff
  // (Handled by Realtime subscriptions)
  
  return NextResponse.json({ success: true })
}
```

### 2. Server Actions
Trigger notifications from server actions:
```typescript
"use server"

export async function completeTicket(ticketId: string) {
  // ... complete ticket in database
  
  // Realtime will automatically trigger notification
}
```

### 3. Client Components
Direct notification on user actions:
```typescript
"use client"

export function ActionButton() {
  const { addNotification } = useNotifications()

  const handleClick = () => {
    // Do action
    addNotification({
      title: "Action Complete",
      message: "It worked!",
      type: "success",
      priority: "medium",
    })
  }

  return <button onClick={handleClick}>Click Me</button>
}
```

## Styling & Customization

### Notification Appearance
Controlled by `NotificationItem` component:
- Colors based on `type` and `priority`
- Icons auto-selected
- Gradients for visual polish
- Dark mode support built-in

### Modifying Colors
Edit `notification-item.tsx`:
```typescript
const typeStyles = {
  success: "border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-green-100/50 ...",
  error: "...",
  // etc
}
```

### Custom Icons
In `notification-item.tsx`:
```typescript
const getIcon = (type: string) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    // Add custom icons here
  }
  return icons[type as keyof typeof icons] || icons.info
}
```

## Testing

### Unit Testing
```typescript
import { renderHook, act } from "@testing-library/react"
import { useNotifications } from "@/lib/notification-context"

test("adds notification", () => {
  const { result } = renderHook(() => useNotifications())

  act(() => {
    result.current.addNotification({
      title: "Test",
      message: "Testing",
      type: "info",
      priority: "medium",
    })
  })

  expect(result.current.notifications).toHaveLength(1)
})
```

### Manual Testing
1. Open browser DevTools
2. Go to Dashboard
3. Trigger notification manually
4. Check notification appears
5. Verify animation and styling

## Performance Tips

1. **Debounce Updates** - Don't spam notifications
   ```typescript
   const debouncedNotify = debounce(addNotification, 1000)
   ```

2. **Limit Active Notifications** - Remove old ones
   ```typescript
   if (notifications.length > 5) {
     removeNotification(notifications[0].id)
   }
   ```

3. **Unsubscribe Properly** - Prevent memory leaks
   ```typescript
   return () => {
     supabase.removeChannel(channel)
   }
   ```

## Troubleshooting

### Notifications Not Showing
1. Check `NotificationContainer` in layout
2. Verify `NotificationProvider` wraps app
3. Check browser console for errors
4. Verify notification data is valid

### Realtime Not Working
1. Check Supabase connection
2. Verify RLS policies
3. Check browser WebSocket connection
4. Look for CORS errors

### Modal Not Appearing
1. Verify modal component imported
2. Check hook return values
3. Verify database fields exist
4. Check user role permissions

## Examples in Codebase

See these files for working examples:
- `components/notifications/notification-demo.tsx` - Demo component
- `hooks/use-ticket-notifications.ts` - Realtime subscriptions
- `hooks/use-acknowledgement-modal.ts` - Modal hook
- `app/dashboard/assigned-tasks/page.tsx` - Integration

## Best Practices

✅ **DO:**
- Use descriptive titles (max 60 chars)
- Include actionable messages
- Set appropriate priority levels
- Provide action links when relevant
- Clean up subscriptions on unmount

❌ **DON'T:**
- Use ALL CAPS excessively
- Send duplicate notifications
- Ignore error notifications
- Forget to unsubscribe
- Use urgent priority for everything

## Support

For issues:
1. Check this guide
2. Review example code
3. Check browser console
4. Contact development team
