"use client"

import { PDFUploadsDashboard } from "@/components/reports/pdf-uploads-dashboard"
import { useAuth } from "@/lib/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ITDocumentsPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    // Allowed roles for viewing IT documents
    const allowedRoles = [
      "admin",
      "it_head",
      "regional_it_head",
      "it_staff",
      "it_store_head",
      "service_desk_head",
      "service_desk_accra",
      "service_desk_kumasi",
      "service_desk_takoradi",
      "service_desk_tema",
      "service_desk_sunyani",
      "service_desk_cape_coast",
    ]
    
    if (!allowedRoles.includes(user.role)) {
      router.push("/dashboard")
    }
  }, [user, router])

  if (!user) {
    return null
  }

  const allowedRoles = [
    "admin",
    "it_head",
    "regional_it_head",
    "it_staff",
    "it_store_head",
    "service_desk_head",
    "service_desk_accra",
    "service_desk_kumasi",
    "service_desk_takoradi",
    "service_desk_tema",
    "service_desk_sunyani",
    "service_desk_cape_coast",
  ]

  if (!allowedRoles.includes(user.role)) {
    return null
  }

  return <PDFUploadsDashboard />
}
