"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNotifications } from "@/lib/notification-context"
import { NotificationItem } from "./notification-item"

export function NotificationContainer() {
  const { notifications } = useNotifications()
  const [displayedNotifications, setDisplayedNotifications] = useState<typeof notifications>([])

  useEffect(() => {
    setDisplayedNotifications(notifications)
  }, [notifications])

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <AnimatePresence>
        <div className="flex flex-col items-center pt-4 gap-3 mx-auto max-w-2xl px-4">
          {displayedNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full pointer-events-auto"
            >
              <NotificationItem notification={notification} />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  )
}
