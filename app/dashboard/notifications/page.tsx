"use client"

import NotificationCenter from "@/components/notifications/notification-center"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "it_head") {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || (user.role !== "admin" && user.role !== "it_head")) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">You do not have access to this page.</p>
      </div>
    )
  }

  return <NotificationCenter />
}
