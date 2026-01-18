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
    const userName = searchParams.get("userName") || ""

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
      // When tasks may have been assigned without a user UUID (assigned_to_name used),
      // count by assigned_to OR assigned_to_name matching the user's name.
      // Build queries conditionally to avoid accidental broad matches when userName is empty.

      // Assigned (pending or in_progress)
      let assignedQuery: any = supabase.from("repair_requests").select("*", { count: "exact", head: true })
      if (userName) {
        assignedQuery = assignedQuery.or(`assigned_to.eq.${userId},assigned_to_name.ilike.%${userName}%`)
      } else {
        assignedQuery = assignedQuery.eq("assigned_to", userId)
      }
      assignedQuery = assignedQuery.in("status", ["pending", "in_progress"])
      const { count: assigned } = await assignedQuery
      assignedTasksCount = assigned || 0

      // In progress
      let inProgressQuery: any = supabase.from("repair_requests").select("*", { count: "exact", head: true })
      if (userName) {
        inProgressQuery = inProgressQuery.or(`assigned_to.eq.${userId},assigned_to_name.ilike.%${userName}%`)
      } else {
        inProgressQuery = inProgressQuery.eq("assigned_to", userId)
      }
      inProgressQuery = inProgressQuery.eq("status", "in_progress")
      const { count: inProgress } = await inProgressQuery
      inProgressTasksCount = inProgress || 0

      // Completed this month
      let completedQueryForUser: any = supabase.from("repair_requests").select("*", { count: "exact", head: true })
      if (userName) {
        completedQueryForUser = completedQueryForUser.or(`assigned_to.eq.${userId},assigned_to_name.ilike.%${userName}%`)
      } else {
        completedQueryForUser = completedQueryForUser.eq("assigned_to", userId)
      }
      completedQueryForUser = completedQueryForUser.eq("status", "completed").gte("updated_at", startOfMonth.toISOString())
      const { count: completed } = await completedQueryForUser
      completedTasksCount = completed || 0

      // Pending review
      let reviewQuery: any = supabase.from("repair_requests").select("*", { count: "exact", head: true })
      if (userName) {
        reviewQuery = reviewQuery.or(`assigned_to.eq.${userId},assigned_to_name.ilike.%${userName}%`)
      } else {
        reviewQuery = reviewQuery.eq("assigned_to", userId)
      }
      reviewQuery = reviewQuery.eq("status", "pending_review")
      const { count: review } = await reviewQuery
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
