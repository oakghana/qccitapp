"use client"

import { useAuth } from "@/lib/auth-context"
import WeeklyInternetReportForm from "@/components/reports/weekly-internet-report-form"
import WeeklyReportsAdminView from "@/components/reports/weekly-reports-admin-view"
import { Wifi } from "lucide-react"

export default function WeeklyInternetReportPage() {
  const { user } = useAuth()

  if (!user) return null

  const isAdminOrHead = user.role === "admin" || user.role === "it_head"
  const isRegionalHead = user.role === "regional_it_head"

  if (!isAdminOrHead && !isRegionalHead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <Wifi className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">Access Restricted</p>
        <p className="text-sm mt-1">Weekly internet reports are for Regional IT Heads, IT Heads, and Admins.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wifi className="h-6 w-6 text-primary" />
          Weekly Internet Services Report
        </h1>
        <p className="text-muted-foreground mt-1">
          {isRegionalHead
            ? "Submit your regional internet services status report each Friday."
            : "Review and acknowledge weekly internet services reports from regional IT heads."}
        </p>
      </div>

      {isRegionalHead ? <WeeklyInternetReportForm /> : <WeeklyReportsAdminView />}
    </div>
  )
}
