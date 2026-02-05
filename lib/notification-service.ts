import { toast } from "@/hooks/use-toast"

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'flash' | 'default'

interface NotificationOptions {
  title: string
  description?: string
  type?: NotificationType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Modern notification service with enhanced visual feedback
 */
export const notificationService = {
  /**
   * Show a success notification
   */
  success: (title: string, description?: string, duration = 5000) => {
    toast({
      title,
      description,
      variant: 'success' as any,
      duration,
    })
  },

  /**
   * Show an error notification
   */
  error: (title: string, description?: string, duration = 7000) => {
    toast({
      title,
      description,
      variant: 'error' as any,
      duration,
    })
  },

  /**
   * Show a warning notification
   */
  warning: (title: string, description?: string, duration = 6000) => {
    toast({
      title,
      description,
      variant: 'warning' as any,
      duration,
    })
  },

  /**
   * Show an info notification
   */
  info: (title: string, description?: string, duration = 5000) => {
    toast({
      title,
      description,
      variant: 'info' as any,
      duration,
    })
  },

  /**
   * Show a flash notification (animated, for important updates like task completions)
   */
  flash: (title: string, description?: string, duration = 8000) => {
    toast({
      title,
      description,
      variant: 'flash' as any,
      duration,
    })
  },

  /**
   * Show a task completion notification (flash style)
   */
  taskCompleted: (taskTitle: string, assignedBy: string) => {
    toast({
      title: '🎉 Task Completed!',
      description: `"${taskTitle}" has been marked as complete by ${assignedBy}`,
      variant: 'flash' as any,
      duration: 8000,
    })
  },

  /**
   * Show a task assigned notification
   */
  taskAssigned: (taskTitle: string, priority: string) => {
    toast({
      title: '📋 New Task Assigned',
      description: `"${taskTitle}" (${priority} priority) has been assigned to you`,
      variant: 'info' as any,
      duration: 7000,
    })
  },

  /**
   * Generic notification with custom options
   */
  show: ({ title, description, type = 'default', duration = 5000, action }: NotificationOptions) => {
    toast({
      title,
      description,
      variant: type as any,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } as any : undefined,
    })
  },
}
