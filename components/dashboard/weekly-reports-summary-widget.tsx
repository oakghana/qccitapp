"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import {
  Wifi, CheckCircle2, Clock, AlertTriangle, TrendingDown,
  TrendingUp, ChevronDown, ChevronUp, ExternalLink, Users
} from "lucide-react"

interface WeeklyReport {
  id: string
  submitted_by_name: string
  location: string
  region: string
  week_number: number
  year: number
  week_start_date: string
  overall_status: string
  uptime_percentage: number | null
  downtime_incidents: number
  downtime_total_hours: number
  users_affected: number
  escalated_to_head_office: boolean
  avg_download_speed_mbps: number | null
  avg_upload_speed_mbps: number | null
  primary_isp: string
  issues_reported: string
  resolutions_taken: string
  status: string
  submitted_at: string | null
}

interface RegionalHead {
  id: string
  full_name: string
  location: string
}

function getMondayOfCurrentWeek(): string {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(today)
  monday.setDate(diff)
  return monday.toISOString().split("T")[0]
}

function getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr)
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

const STATUS_COLOR: Record<string, string> = {
  operational: "bg-green-100 text-green-800",
  degraded: "bg-yellow-100 text-yellow-800",
  outage: "bg-red-100 text-red-800",
  maintenance: "bg-blue-100 text-blue-800",
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    operational: "bg-green-500",
    degraded: "bg-yellow-500",
    outage: "bg-red-500",
    maintenance: "bg-blue-500",
  }
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[status] || "bg-gray-400"}`} />
}

export function WeeklyReportsSummaryWidget() {
  const router = useRouter()
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [regionalHeads, setRegionalHeads] = useState<RegionalHead[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const currentWeekStart = getMondayOfCurrentWeek()
  const currentWeekNumber = getWeekNumber(currentWeekStart)
  const currentYear = new Date().getFullYear()

  const load = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch regional IT heads and this week's reports in parallel
      const [headsRes, reportsRes] = await Promise.all([
        fetch("/api/weekly-internet-reports/regional-heads"),
        fetch(
          `/api/weekly-internet-reports?role=admin&year=${currentYear}&limit=100`
        ),
      ])

      const [headsData, reportsData] = await Promise.all([
        headsRes.json(),
        reportsRes.json(),
      ])

      if (headsData.heads) setRegionalHeads(headsData.heads)

      if (reportsData.reports) {
        // Only keep this week's submitted/acknowledged reports
        const thisWeek = (reportsData.reports as WeeklyReport[]).filter(
          (r) =>
            r.week_start_date === currentWeekStart &&
            (r.status === "submitted" || r.status === "acknowledged")
        )
        setReports(thisWeek)
      }
    } catch (e) {
      console.error("[WeeklyReportsSummaryWidget] load error", e)
    } finally {
      setLoading(false)
    }
  }, [currentWeekStart, currentYear])

  useEffect(() => {
    load()
  }, [load])

  const totalHeads = regionalHeads.length
  const submittedCount = reports.length
  const allSubmitted = totalHeads > 0 && submittedCount >= totalHeads
  const completionPct = totalHeads > 0 ? Math.round((submittedCount / totalHeads) * 100) : 0

  // Aggregate summary stats across all submitted reports
  const avgUptime =
    reports.filter((r) => r.uptime_percentage != null).length > 0
      ? (
          reports.reduce((s, r) => s + (r.uptime_percentage ?? 0), 0) /
          reports.filter((r) => r.uptime_percentage != null).length
        ).toFixed(1)
      : null

  const totalDowntimeIncidents = reports.reduce((s, r) => s + (r.downtime_incidents || 0), 0)
  const totalDowntimeHours = reports.reduce((s, r) => s + (r.downtime_total_hours || 0), 0)
  const totalUsersAffected = reports.reduce((s, r) => s + (r.users_affected || 0), 0)
  const escalatedCount = reports.filter((r) => r.escalated_to_head_office).length
  const outageCount = reports.filter((r) => r.overall_status === "outage").length
  const degradedCount = reports.filter((r) => r.overall_status === "degraded").length

  // Locations that have NOT yet submitted
  const submittedLocations = new Set(reports.map((r) => r.location?.trim().toLowerCase()))
  const pendingHeads = regionalHeads.filter(
    (h) => !submittedLocations.has(h.location?.trim().toLowerCase())
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Loading weekly report summary...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Wifi className="h-4 w-4 text-orange-600" />
            Weekly Internet Report — Week {currentWeekNumber}/{currentYear}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs h-7 px-2"
            onClick={() => router.push("/dashboard/weekly-internet-report")}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Full View
          </Button>
        </div>

        {/* Submission progress bar */}
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {submittedCount} of {totalHeads} regional heads submitted
            </span>
            {allSubmitted ? (
              <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px] h-5">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                All Submitted
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-[10px] h-5">
                <Clock className="h-3 w-3 mr-1" />
                Awaiting {totalHeads - submittedCount}
              </Badge>
            )}
          </div>
          <Progress
            value={completionPct}
            className="h-2"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Aggregate summary — shown even if not all submitted */}
        {submittedCount > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <div className="text-lg font-bold text-green-600">{avgUptime != null ? `${avgUptime}%` : "N/A"}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Avg Uptime</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <div className="text-lg font-bold text-red-600">{totalDowntimeIncidents}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Total Incidents</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <div className="text-lg font-bold text-orange-600">{totalDowntimeHours}h</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Downtime Hours</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2.5 text-center">
              <div className="text-lg font-bold text-blue-600">{totalUsersAffected}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Users Affected</div>
            </div>
          </div>
        )}

        {/* Alerts row */}
        {submittedCount > 0 && (outageCount > 0 || escalatedCount > 0 || degradedCount > 0) && (
          <div className="flex flex-wrap gap-2">
            {outageCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2.5 py-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {outageCount} location{outageCount > 1 ? "s" : ""} with outage
              </div>
            )}
            {degradedCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-2.5 py-1">
                <TrendingDown className="h-3.5 w-3.5" />
                {degradedCount} degraded
              </div>
            )}
            {escalatedCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-2.5 py-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {escalatedCount} escalated to HQ
              </div>
            )}
          </div>
        )}

        {/* Collapsible per-location breakdown */}
        {submittedCount > 0 && (
          <div>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <span>Per-location breakdown ({submittedCount} report{submittedCount !== 1 ? "s" : ""})</span>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {expanded && (
              <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {reports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusDot status={r.overall_status} />
                      <div className="min-w-0">
                        <span className="font-medium truncate">{r.location || r.submitted_by_name}</span>
                        {r.primary_isp && (
                          <span className="text-muted-foreground ml-1">· {r.primary_isp}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.uptime_percentage != null && (
                        <span className="text-muted-foreground">{r.uptime_percentage}%</span>
                      )}
                      {r.escalated_to_head_office && (
                        <Badge className="bg-red-100 text-red-700 text-[9px] h-4 px-1">Escalated</Badge>
                      )}
                      <Badge className={`text-[9px] h-4 px-1 ${STATUS_COLOR[r.overall_status] || "bg-gray-100 text-gray-700"}`}>
                        {r.overall_status}
                      </Badge>
                      {(r.avg_download_speed_mbps != null || r.avg_upload_speed_mbps != null) && (
                        <span className="text-muted-foreground hidden sm:flex items-center gap-0.5">
                          <TrendingDown className="h-3 w-3 text-blue-400" />
                          {r.avg_download_speed_mbps ?? "?"}
                          <TrendingUp className="h-3 w-3 text-green-400 ml-0.5" />
                          {r.avg_upload_speed_mbps ?? "?"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pending locations */}
        {pendingHeads.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Still awaiting ({pendingHeads.length}):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {pendingHeads.map((h) => (
                <Badge
                  key={h.id}
                  variant="outline"
                  className="text-[10px] h-5 text-muted-foreground border-dashed"
                >
                  {h.location || h.full_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {submittedCount === 0 && totalHeads === 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">
            No regional IT heads found. Add regional heads to track their reports here.
          </p>
        )}

        {submittedCount === 0 && totalHeads > 0 && (
          <p className="text-center text-xs text-muted-foreground py-3">
            No reports submitted yet for this week.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
