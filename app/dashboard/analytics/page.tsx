"use client"

import { Analytics } from "@/components/admin/analytics"
import { useAuth } from "@/lib/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AnalyticsPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const allowedRoles = ["admin", "it_head", "regional_it_head"]
    if (!allowedRoles.includes(user.role)) {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user || !["admin", "it_head", "regional_it_head"].includes(user.role)) {
    return null
  }

  return <Analytics />
}
