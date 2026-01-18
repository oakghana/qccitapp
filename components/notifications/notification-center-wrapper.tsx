"use client"

import dynamic from "next/dynamic"
import React from "react"
import { useAuth } from "@/lib/auth-context"

const NotificationCenterNoSSR = dynamic(
  () => import("./notification-center"),
  { ssr: false }
)

export default function NotificationCenterWrapper() {
  const { user } = useAuth()

  const role = user?.role || ""
  const allowed = role === "admin" || role === "it_head"

  if (!allowed) return null

  return <NotificationCenterNoSSR />
}
