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

    // Helper function to filter repairs by location
    const applyRepairLocationFilter = (query: any) => {
      if (!canSeeAll && location) {
        // Repairs use requester_location field
        return query.ilike("requester_location", `%${location}%`)
      }
      return query
    }

    // Helper function to filter devices by location
    const applyDeviceLocationFilter = (query: any) => {
      if (!canSeeAll && location) {
        return query.ilike("location", `%${location}%`)
      }
      return query
    }

    // Fetch total devices
    let devicesQuery = supabase
      .from("devices")
      .select("*", { count: "exact", head: true })
    
    devicesQuery = applyDeviceLocationFilter(devicesQuery)
    
    const { count: devicesCount, error: devicesError } = await devicesQuery
    if (devicesError) console.error("[v0] Error fetching devices:", devicesError)

    // Fetch active repairs (all non-completed/non-rejected statuses)
    let repairsQuery = supabase
      .from("repair_requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "approved", "in_transit", "with_provider", "in_progress", "assigned"])
    
    repairsQuery = applyRepairLocationFilter(repairsQuery)
    
    const { count: activeRepairsCount, error: repairsError } = await repairsQuery
    if (repairsError) console.error("[v0] Error fetching repairs:", repairsError.message || repairsError)

    // Fetch completed repairs this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    let completedQuery = supabase
      .from("repair_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("updated_at", startOfMonth.toISOString())
    
    completedQuery = applyRepairLocationFilter(completedQuery)
    
    const { count: completedRepairsCount, error: completedError } = await completedQuery
    if (completedError) console.error("[v0] Error fetching completed repairs:", completedError.message || completedError)

    // Fetch pending approvals (users with pending status)
    const { count: pendingApprovalsCount, error: pendingError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
    if (pendingError) console.error("[v0] Error fetching pending approvals:", pendingError.message || pendingError)

    // For IT staff - fetch assigned tasks from both repair_requests and service_tickets
    let assignedTasksCount = 0
    let inProgressTasksCount = 0
    let completedTasksCount = 0
    let pendingReviewCount = 0

    if (userRole === "it_staff" && userId) {
      // Repair tasks
      const { count: assignedRepairs } = await supabase
        .from("repair_requests")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .not("status", "in", ["completed", "rejected", "resolved", "closed"])
      
      // Service tickets assigned to staff
      const { count: assignedTickets } = await supabase
        .from("service_tickets")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .not("status", "in", ["resolved", "closed", "completed"])
      
      assignedTasksCount = (assignedRepairs || 0) + (assignedTickets || 0)

      const { count: inProgressRepairs } = await supabase
        .from("repair_requests")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .in("status", ["in_progress", "in_transit", "with_provider", "assigned"])
      
      const { count: inProgressTickets } = await supabase
        .from("service_tickets")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .in("status", ["in_progress", "assigned"])
      
      inProgressTasksCount = (inProgressRepairs || 0) + (inProgressTickets || 0)

      const { count: completedRepairs } = await supabase
        .from("repair_requests")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .eq("status", "completed")
        .gte("updated_at", startOfMonth.toISOString())
      
      const { count: completedTickets } = await supabase
        .from("service_tickets")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .in("status", ["resolved", "closed", "completed"])
        .gte("updated_at", startOfMonth.toISOString())
      
      completedTasksCount = (completedRepairs || 0) + (completedTickets || 0)

      const { count: reviewRepairs } = await supabase
        .from("repair_requests")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .eq("status", "pending_review")
      
      const { count: reviewTickets } = await supabase
        .from("service_tickets")
        .select("*", { count: "exact", head: true })
        .eq("assigned_to", userId)
        .eq("status", "awaiting_confirmation")
      
      pendingReviewCount = (reviewRepairs || 0) + (reviewTickets || 0)
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
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
