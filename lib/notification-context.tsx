"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { toast } from "sonner"
import { CheckCircle, AlertCircle, XCircle, Info } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  timestamp: Date
  isRead: boolean
  actionUrl?: string
  actionLabel?: string
  userId?: string
  priority: "low" | "medium" | "high" | "urgent"
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "isRead">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  showToast: (title: string, message?: string, type?: "info" | "success" | "warning" | "error") => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const addNotification = (notificationData: Omit<Notification, "id" | "timestamp" | "isRead">) => {
    const notificationId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    const newNotification: Notification = {
      ...notificationData,
      id: notificationId,
      timestamp: new Date(),
      isRead: false,
    }

    setNotifications((prev) => [newNotification, ...prev])

    // Show toast notification
    showToast(newNotification.title, newNotification.message, newNotification.type)

    // Play sound for urgent notifications
    if (newNotification.priority === "urgent") {
      playNotificationSound()
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const showToast = (title: string, message?: string, type: "info" | "success" | "warning" | "error" = "info") => {
    const toastContent = (
      <div className="flex items-start space-x-3">
        {type === "success" && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
        {type === "warning" && <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />}
        {type === "error" && <XCircle className="h-5 w-5 text-red-500 mt-0.5" />}
        {type === "info" && <Info className="h-5 w-5 text-blue-500 mt-0.5" />}
        <div className="flex-1">
          <div className="font-medium text-sm">{title}</div>
          {message && <div className="text-sm text-muted-foreground mt-1">{message}</div>}
        </div>
      </div>
    )

    switch (type) {
      case "success":
        toast.success(toastContent)
        break
      case "warning":
        toast.warning(toastContent)
        break
      case "error":
        toast.error(toastContent)
        break
      default:
        toast.info(toastContent)
    }
  }

  const playNotificationSound = () => {
    try {
      if (typeof window === "undefined") return

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const audioContext = new AudioContextClass()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error("Notification sound failed:", error)
    }
  }

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    showToast,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

// Notification hook for different modules
export function useModuleNotifications(module: string) {
  const { addNotification } = useNotifications()

  const notifyTaskAssignment = (
    taskTitle: string,
    assignee: string,
    priority: "low" | "medium" | "high" | "urgent" = "medium",
  ) => {
    addNotification({
      title: "New Task Assignment",
      message: `${taskTitle} has been assigned to ${assignee}`,
      type: "info",
      priority,
      actionUrl: `/dashboard/${module}`,
      actionLabel: "View Task",
    })
  }

  const notifyTaskCompletion = (taskTitle: string, completedBy: string) => {
    addNotification({
      title: "Task Completed",
      message: `${taskTitle} has been completed by ${completedBy}`,
      type: "success",
      priority: "medium",
      actionUrl: `/dashboard/${module}`,
      actionLabel: "View Details",
    })
  }

  const notifyUrgentIssue = (issueTitle: string, description: string) => {
    addNotification({
      title: "Urgent Issue",
      message: `${issueTitle}: ${description}`,
      type: "error",
      priority: "urgent",
      actionUrl: `/dashboard/${module}`,
      actionLabel: "Take Action",
    })
  }

  const notifyStatusChange = (itemTitle: string, oldStatus: string, newStatus: string) => {
    addNotification({
      title: "Status Update",
      message: `${itemTitle} status changed from ${oldStatus} to ${newStatus}`,
      type: "info",
      priority: "medium",
      actionUrl: `/dashboard/${module}`,
      actionLabel: "View Item",
    })
  }

  return {
    notifyTaskAssignment,
    notifyTaskCompletion,
    notifyUrgentIssue,
    notifyStatusChange,
  }
}
