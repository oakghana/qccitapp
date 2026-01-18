import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get("location")
    const canSeeAll = searchParams.get("canSeeAll") === "true"
    const userId = searchParams.get("userId")
    const userRole = searchParams.get("userRole")

    console.log("[v0] Dashboard stats API - location:", location, "canSeeAll:", canSeeAll, "role:", userRole)

    // Helper function to build location filter
    const applyLocationFilter = (query: any, table: string = "") => {
      if (!canSeeAll && location) {
        const col = table ? `${table}.location` : "location"
        return query.or(`location.ilike.${location},location.ilike.%${location}%`)
      }
      return query
    }

    // Fetch total devices
    let devicesQuery = supabase
      .from("devices")
      .select("*", { count: "exact", head: true })
    
    if (!canSeeAll && location) {
      devicesQuery = devicesQuery.or(`location.ilike.${location},location.ilike.%${location}%`)
    }
    
    const { count: devicesCount, error: devicesError } = await devicesQuery
    if (devicesError) console.error("[v0] Error fetching devices:", devicesError)

    // Fetch active repairs (in_progress status)
    let repairsQuery = supabase
      .from("repair_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress")
    
    if (!canSeeAll && location) {
      repairsQuery = repairsQuery.or(`location.ilike.${location},location.ilike.%${location}%`)
    }
    
    const { count: activeRepairsCount, error: repairsError } = await repairsQuery
    if (repairsError) console.error("[v0] Error fetching repairs:", repairsError)

    // Fetch completed repairs this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    let completedQuery = supabase
      .from("repair_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("updated_at", startOfMonth.toISOString())
    
    if (!canSeeAll && location) {
      completedQuery = completedQuery.or(`location.ilike.${location},location.ilike.%${location}%`)
    }
    
    const { count: completedRepairsCount, error: completedError } = await completedQuery
    if (completedError) console.error("[v0] Error fetching completed repairs:", completedError)

    // Fetch pending approvals (users with pending status)
    const { count: pendingApprovalsCount, error: pendingError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
    if (pendingError) console.error("[v0] Error fetching pending approvals:", pendingError)

    // For IT staff - fetch assigned tasks
    let assignedTasksCount = 0
    let inProgressTasksCount = 0
    let completedTasksCount = 0
    let pendingReviewCount = 0

    if (userRole === "it_staff" && userId) {
      const { count: assigned } = await supabase
        .from("repair_requests")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .in("status", ["pending", "in_progress"])
      assignedTasksCount = assigned || 0

      const { count: inProgress } = await supabase
        .from("repair_requests")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .eq("status", "in_progress")
      inProgressTasksCount = inProgress || 0

      const { count: completed } = await supabase
        .from("repair_requests")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .eq("status", "completed")
        .gte("updated_at", startOfMonth.toISOString())
      completedTasksCount = completed || 0

      const { count: review } = await supabase
        .from("repair_requests")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .eq("status", "pending_review")
      pendingReviewCount = review || 0
    }

    const stats = {
      totalDevices: devicesCount || 0,
      activeRepairs: activeRepairsCount || 0,
      completedRepairs: completedRepairsCount || 0,
      pendingApprovals: pendingApprovalsCount || 0,
      assignedTasks: assignedTasksCount,
      inProgressTasks: inProgressTasksCount,
      completedTasks: completedTasksCount,
      pendingReview: pendingReviewCount,
    }

    console.log("[v0] Dashboard stats:", stats)
    return NextResponse.json(stats)
  } catch (error: any) {
    console.error("[v0] Error in dashboard stats API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
