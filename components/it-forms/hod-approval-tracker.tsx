"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock3, RefreshCw, ShieldAlert, Users } from "lucide-react"

type HodSummary = {
  hodName: string
  totalReviewed: number
  approved: number
  rejected: number
  requisitionCount: number
  newGadgetCount: number
  maintenanceCount: number
  lastActionAt: string | null
}

type RecentApproval = {
  formType: "requisition" | "new-gadget" | "maintenance"
  requestNumber: string
  requester: string
  hodName: string
  action: "approved" | "rejected"
  actionAt: string
}

type TrackerResponse = {
  success: boolean
  summary: {
    totalForms: number
    pendingHod: number
    approvedHod: number
    rejectedHod: number
    uniqueHods: number
  }
  byHod: HodSummary[]
  recentApprovals: RecentApproval[]
}

export function HodApprovalTracker() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TrackerResponse | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/it-forms/hod-approval-tracker")
      const result = await response.json()
      if (response.ok && result.success) {
        setData(result)
      } else {
        setData(null)
      }
    } catch (error) {
      console.error("[v0] Failed to load HOD tracker:", error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const totals = useMemo(() => {
    return (
      data?.summary || {
        totalForms: 0,
        pendingHod: 0,
        approvedHod: 0,
        rejectedHod: 0,
        uniqueHods: 0,
      }
    )
  }, [data])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-stone-50 p-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">HOD Approval Tracker</h3>
          <p className="text-sm text-muted-foreground">Cross-form approval activity for all department heads.</p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading} className="border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-900">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.totalForms}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending HOD</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-900">{totals.pendingHod}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Approved by HOD</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-900">{totals.approvedHod}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rejected by HOD</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">{totals.rejectedHod}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active HODs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.uniqueHods}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-emerald-800" />
              Approval Load by HOD
            </CardTitle>
            <CardDescription>How each HOD is handling requisitions, gadget requests, and maintenance requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading approval metrics...</p>
            ) : !data || data.byHod.length === 0 ? (
              <p className="text-sm text-muted-foreground">No HOD approval activity found.</p>
            ) : (
              <div className="space-y-3">
                {data.byHod.map((row) => (
                  <div key={row.hodName} className="rounded-lg border border-gray-200 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium">{row.hodName}</p>
                      <Badge className="bg-emerald-100 text-emerald-900">{row.totalReviewed} reviewed</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <p>Requisition: <span className="font-semibold text-foreground">{row.requisitionCount}</span></p>
                      <p>New Gadget: <span className="font-semibold text-foreground">{row.newGadgetCount}</span></p>
                      <p>Maintenance: <span className="font-semibold text-foreground">{row.maintenanceCount}</span></p>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <span className="text-emerald-800">Approved: {row.approved}</span>
                      <span className="text-red-700">Rejected: {row.rejected}</span>
                      <span className="text-muted-foreground">
                        Last action: {row.lastActionAt ? new Date(row.lastActionAt).toLocaleString() : "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock3 className="h-4 w-4 text-emerald-800" />
              Recent HOD Decisions
            </CardTitle>
            <CardDescription>Latest approval and rejection actions across all IT request forms.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading recent actions...</p>
            ) : !data || data.recentApprovals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent HOD decisions found.</p>
            ) : (
              <div className="space-y-2">
                {data.recentApprovals.map((item, idx) => (
                  <div key={`${item.requestNumber}-${idx}`} className="rounded-md border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{item.requestNumber}</p>
                      <Badge className={item.action === "approved" ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-800"}>
                        {item.action === "approved" ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <ShieldAlert className="mr-1 h-3 w-3" />}
                        {item.action}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.hodName} • {item.formType.replace("-", " ")} • {item.requester}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(item.actionAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
