import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

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

function toIsoDate(value?: string | null): string | null {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.length > 10 ? value : `${value}T00:00:00.000Z`
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function upsertHodSummary(map: Map<string, HodSummary>, hodName: string): HodSummary {
  const key = hodName.trim()
  if (!map.has(key)) {
    map.set(key, {
      hodName: key,
      totalReviewed: 0,
      approved: 0,
      rejected: 0,
      requisitionCount: 0,
      newGadgetCount: 0,
      maintenanceCount: 0,
      lastActionAt: null,
    })
  }
  return map.get(key)!
}

export async function GET() {
  try {
    const [requisitionResp, newGadgetResp, maintenanceResp] = await Promise.all([
      supabaseAdmin
        .from("it_equipment_requisitions")
        .select("id, requisition_number, requested_by, status, created_at, department_head_approved, department_head_approved_by, department_head_approved_at"),
      supabaseAdmin
        .from("new_gadget_requests")
        .select("id, request_number, staff_name, status, created_at, departmental_head_name, departmental_head_date"),
      supabaseAdmin
        .from("maintenance_repair_requests")
        .select("id, request_number, staff_name, status, created_at, sectional_head_name, sectional_head_date"),
    ])

    if (requisitionResp.error) throw requisitionResp.error
    if (newGadgetResp.error) throw newGadgetResp.error
    if (maintenanceResp.error) throw maintenanceResp.error

    const requisitions = requisitionResp.data || []
    const newGadget = newGadgetResp.data || []
    const maintenance = maintenanceResp.data || []

    let pendingHod = 0
    let approvedHod = 0
    let rejectedHod = 0

    const byHod = new Map<string, HodSummary>()
    const recentApprovals: RecentApproval[] = []

    for (const req of requisitions) {
      const status = String(req.status || "").toLowerCase()
      const hod = (req.department_head_approved_by || "").trim()
      const approvedAt = toIsoDate(req.department_head_approved_at)

      const isPending = ["pending_department_head", "pending_hod", "pending", "draft"].includes(status) && !hod
      if (isPending) {
        pendingHod += 1
        continue
      }

      if (!hod) continue

      const isRejected = status.includes("rejected") || req.department_head_approved === false
      const summary = upsertHodSummary(byHod, hod)
      summary.totalReviewed += 1
      summary.requisitionCount += 1

      if (isRejected) {
        summary.rejected += 1
        rejectedHod += 1
      } else {
        summary.approved += 1
        approvedHod += 1
      }

      if (approvedAt && (!summary.lastActionAt || approvedAt > summary.lastActionAt)) {
        summary.lastActionAt = approvedAt
      }

      if (approvedAt) {
        recentApprovals.push({
          formType: "requisition",
          requestNumber: req.requisition_number || req.id,
          requester: req.requested_by || "Unknown",
          hodName: hod,
          action: isRejected ? "rejected" : "approved",
          actionAt: approvedAt,
        })
      }
    }

    for (const req of newGadget) {
      const status = String(req.status || "").toLowerCase()
      const hod = (req.departmental_head_name || "").trim()
      const actionAt = toIsoDate(req.departmental_head_date)

      const isPending = ["pending_hod", "pending_department_head", "pending", "draft"].includes(status) && !hod
      if (isPending) {
        pendingHod += 1
        continue
      }

      if (!hod) continue

      const isRejected = status.includes("reject") || status.includes("not_recommended")
      const summary = upsertHodSummary(byHod, hod)
      summary.totalReviewed += 1
      summary.newGadgetCount += 1

      if (isRejected) {
        summary.rejected += 1
        rejectedHod += 1
      } else {
        summary.approved += 1
        approvedHod += 1
      }

      if (actionAt && (!summary.lastActionAt || actionAt > summary.lastActionAt)) {
        summary.lastActionAt = actionAt
      }

      if (actionAt) {
        recentApprovals.push({
          formType: "new-gadget",
          requestNumber: req.request_number || req.id,
          requester: req.staff_name || "Unknown",
          hodName: hod,
          action: isRejected ? "rejected" : "approved",
          actionAt,
        })
      }
    }

    for (const req of maintenance) {
      const status = String(req.status || "").toLowerCase()
      const hod = (req.sectional_head_name || "").trim()
      const actionAt = toIsoDate(req.sectional_head_date)

      const isPending = ["pending_hod", "pending_department_head", "pending", "draft"].includes(status) && !hod
      if (isPending) {
        pendingHod += 1
        continue
      }

      if (!hod) continue

      const isRejected = status.includes("reject") || status.includes("not_recommended")
      const summary = upsertHodSummary(byHod, hod)
      summary.totalReviewed += 1
      summary.maintenanceCount += 1

      if (isRejected) {
        summary.rejected += 1
        rejectedHod += 1
      } else {
        summary.approved += 1
        approvedHod += 1
      }

      if (actionAt && (!summary.lastActionAt || actionAt > summary.lastActionAt)) {
        summary.lastActionAt = actionAt
      }

      if (actionAt) {
        recentApprovals.push({
          formType: "maintenance",
          requestNumber: req.request_number || req.id,
          requester: req.staff_name || "Unknown",
          hodName: hod,
          action: isRejected ? "rejected" : "approved",
          actionAt,
        })
      }
    }

    const hodSummaries = Array.from(byHod.values()).sort((a, b) => b.totalReviewed - a.totalReviewed)
    const latestApprovals = recentApprovals.sort((a, b) => (a.actionAt < b.actionAt ? 1 : -1)).slice(0, 12)

    return NextResponse.json({
      success: true,
      summary: {
        totalForms: requisitions.length + newGadget.length + maintenance.length,
        pendingHod,
        approvedHod,
        rejectedHod,
        uniqueHods: hodSummaries.length,
      },
      byHod: hodSummaries,
      recentApprovals: latestApprovals,
    })
  } catch (error: any) {
    console.error("[v0] Error loading HOD approval tracker:", error)
    return NextResponse.json({ success: false, error: error?.message || "Failed to load HOD approval tracker" }, { status: 500 })
  }
}
