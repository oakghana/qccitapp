"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { useNotifications } from "@/lib/notification-context"
import { Button } from "@/components/ui/button"

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

interface NotificationItemProps {
  notification: Notification
}

const getNotificationStyles = (type: string, priority: string) => {
  const baseStyles = "relative overflow-hidden rounded-lg border backdrop-blur-sm"

  const typeStyles = {
    success: "border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50",
    error: "border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950 dark:to-red-900/50",
    warning: "border-yellow-200 dark:border-yellow-800 bg-gradient-to-r from-yellow-50 to-yellow-100/50 dark:from-yellow-950 dark:to-yellow-900/50",
    info: "border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50",
  }

  return `${baseStyles} ${typeStyles[type as keyof typeof typeStyles] || typeStyles.info}`
}

const getIconStyles = (type: string) => {
  const styles = {
    success: "text-green-600 dark:text-green-400",
    error: "text-red-600 dark:text-red-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    info: "text-blue-600 dark:text-blue-400",
  }
  return styles[type as keyof typeof styles] || styles.info
}

const getIcon = (type: string) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertTriangle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  }
  return icons[type as keyof typeof icons] || icons.info
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { removeNotification } = useNotifications()

  const handleDismiss = () => {
    removeNotification(notification.id)
  }

  const borderColor = {
    success: "from-green-400 to-emerald-500",
    error: "from-red-400 to-rose-500",
    warning: "from-yellow-400 to-orange-500",
    info: "from-blue-400 to-cyan-500",
  }[notification.type]

  return (
    <motion.div
      layout
      className={getNotificationStyles(notification.type, notification.priority)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Gradient border top */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${borderColor}`} />

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 mt-0.5 ${getIconStyles(notification.type)}`}>
            {getIcon(notification.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white leading-tight">
              {notification.title}
            </h3>
            {notification.message && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                {notification.message}
              </p>
            )}

            {/* Action button */}
            {notification.actionUrl && notification.actionLabel && (
              <div className="mt-3 flex items-center gap-2">
                <Link href={notification.actionUrl}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-medium bg-white/50 hover:bg-white dark:bg-gray-800/50 dark:hover:bg-gray-800"
                  >
                    {notification.actionLabel}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Priority indicator */}
        {notification.priority === "urgent" && (
          <div className="mt-3 flex items-center gap-2">
            <div className="inline-block px-2.5 py-1 bg-red-100 dark:bg-red-900/30 rounded text-red-700 dark:text-red-300 text-xs font-semibold">
              ⚡ URGENT
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
