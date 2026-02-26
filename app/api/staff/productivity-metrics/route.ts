import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ProductivityMetrics {
  staffId: string
  staffName: string
  email: string
  location: string
  role: string
  totalTasksAssigned: number
  completedTasks: number
  onTimeCompletions: number
  averageCompletionDays: number
  completionRate: number
  onTimeRate: number
  productivityScore: number
  speedBonus: number
  rank: number
  grading: "Excellent" | "Good" | "Average" | "Below Average" | "Poor"
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const location = searchParams.get("location")

    console.log("[v0] Fetching productivity metrics for date range:", startDate, "to", endDate)

    // Fetch all IT staff members
    let staffQuery = supabaseAdmin
      .from("profiles")
      .select("*")
      .in("role", ["it_staff", "it_head", "regional_it_head"])
      .eq("status", "approved")
      .eq("is_active", true)

    if (location && location !== "all") {
      staffQuery = staffQuery.eq("location", location)
    }

    const { data: staff, error: staffError } = await staffQuery

    if (staffError) {
      console.error("[v0] Error fetching staff:", staffError)
      return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 })
    }

    // Calculate productivity metrics for each staff member
    const metricsPromises = (staff || []).map(async (member) => {
      // Fetch repair requests assigned to this staff
      let repairQuery = supabaseAdmin
        .from("repair_requests")
        .select("id, status, priority, created_at, updated_at, assigned_date, completed_date")
        .eq("assigned_to", member.id)

      if (startDate) {
        repairQuery = repairQuery.gte("created_at", startDate)
      }
      if (endDate) {
        repairQuery = repairQuery.lte("created_at", endDate)
      }

      const { data: repairs } = await repairQuery

      // Fetch service tickets assigned to this staff
      let ticketQuery = supabaseAdmin
        .from("service_tickets")
        .select("id, status, priority, created_at, updated_at, assigned_at, resolved_at, completed_at")
        .eq("assigned_to", member.id)

      if (startDate) {
        ticketQuery = ticketQuery.gte("created_at", startDate)
      }
      if (endDate) {
        ticketQuery = ticketQuery.lte("created_at", endDate)
      }

      const { data: tickets } = await ticketQuery

      const allTasks = [...(repairs || []), ...(tickets || [])]
      const totalTasks = allTasks.length

      // Calculate completed tasks
      const completedStatuses = ["completed", "closed", "resolved", "repaired"]
      const cutoff = new Date(Date.now() - 30 * 60 * 1000)
      const completedTasks = allTasks.filter((t) => {
        const status = (t.status || "").toLowerCase()
        if (completedStatuses.includes(status)) return true
        // treat tickets still awaiting confirmation as done if old enough
        if (status === "awaiting_confirmation" && t.completed_at) {
          const completedDate = new Date(t.completed_at)
          if (completedDate <= cutoff) return true
        }
        return false
      })

      // Calculate completion times and on-time metrics
      let totalCompletionDays = 0
      let onTimeCompletions = 0

      completedTasks.forEach((task) => {
        const startDate = new Date(task.created_at)
        // use the time IT staff marked completion if available; fallback to updated_at
        const endDate = new Date(task.completed_at || task.resolved_at || task.updated_at)
        const completionDays = Math.max(
          1,
          Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        )
        
        totalCompletionDays += completionDays

        // Determine expected completion time based on priority
        const priority = task.priority?.toLowerCase() || "medium"
        let expectedDays = 7 // default
        if (priority === "critical") expectedDays = 1
        else if (priority === "high") expectedDays = 3
        else if (priority === "medium") expectedDays = 5
        else if (priority === "low") expectedDays = 10

        if (completionDays <= expectedDays) {
          onTimeCompletions++
        }
      })

      const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0
      const onTimeRate = completedTasks.length > 0 ? (onTimeCompletions / completedTasks.length) * 100 : 0
      const averageCompletionDays = completedTasks.length > 0 ? totalCompletionDays / completedTasks.length : 0

      // Calculate speed bonus (faster completion = higher bonus)
      // If avg completion is less than 3 days = 20 bonus points
      // 3-5 days = 10 bonus points
      // 5-7 days = 5 bonus points
      // Over 7 days = 0 bonus points
      let speedBonus = 0
      if (averageCompletionDays > 0 && averageCompletionDays <= 3) speedBonus = 20
      else if (averageCompletionDays <= 5) speedBonus = 10
      else if (averageCompletionDays <= 7) speedBonus = 5

      // Calculate volume bonus based on total tasks completed
      // More tasks completed = higher productivity contribution
      // Scale: Every 10 completed tasks adds a volume multiplier
      // This ensures staff handling more work get rewarded appropriately
      const volumeMultiplier = 1 + (completedTasks.length / 50) // +0.2 per 10 tasks, capped naturally
      
      // Calculate base productivity score
      // 40% completion rate + 25% on-time rate + 15% speed bonus + 20% volume factor
      const baseScore = completionRate * 0.4 + onTimeRate * 0.25 + speedBonus * 0.75
      
      // Apply volume multiplier to reward high-volume workers
      // Staff with more completed tasks get proportionally higher scores
      const volumeBonus = Math.min(30, completedTasks.length * 0.5) // Up to 30 points for volume
      
      const productivityScore = Math.round(
        baseScore + volumeBonus
      )

      // Determine grading (adjusted for volume-weighted scoring)
      let grading: "Excellent" | "Good" | "Average" | "Below Average" | "Poor"
      if (productivityScore >= 90) grading = "Excellent"
      else if (productivityScore >= 75) grading = "Good"
      else if (productivityScore >= 55) grading = "Average"
      else if (productivityScore >= 35) grading = "Below Average"
      else grading = "Poor"

      return {
        staffId: member.id,
        staffName: member.full_name || member.email,
        email: member.email,
        location: member.location || "Unknown",
        role: member.role,
        totalTasksAssigned: totalTasks,
        completedTasks: completedTasks.length,
        onTimeCompletions,
        averageCompletionDays: Math.round(averageCompletionDays * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        onTimeRate: Math.round(onTimeRate * 10) / 10,
        productivityScore,
        speedBonus,
        rank: 0, // Will be set after sorting
        grading,
      } as ProductivityMetrics
    })

    const metrics = await Promise.all(metricsPromises)

    // Sort by productivity score and assign ranks
    const rankedMetrics = metrics
      .sort((a, b) => b.productivityScore - a.productivityScore)
      .map((m, index) => ({
        ...m,
        rank: index + 1,
      }))

    console.log("[v0] Calculated productivity metrics for", rankedMetrics.length, "staff members")

    return NextResponse.json({
      success: true,
      metrics: rankedMetrics,
      summary: {
        totalStaff: rankedMetrics.length,
        avgProductivityScore:
          rankedMetrics.reduce((sum, m) => sum + m.productivityScore, 0) / rankedMetrics.length || 0,
        totalTasksAssigned: rankedMetrics.reduce((sum, m) => sum + m.totalTasksAssigned, 0),
        totalCompletedTasks: rankedMetrics.reduce((sum, m) => sum + m.completedTasks, 0),
        avgCompletionRate:
          rankedMetrics.reduce((sum, m) => sum + m.completionRate, 0) / rankedMetrics.length || 0,
        avgOnTimeRate: rankedMetrics.reduce((sum, m) => sum + m.onTimeRate, 0) / rankedMetrics.length || 0,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error calculating productivity metrics:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
