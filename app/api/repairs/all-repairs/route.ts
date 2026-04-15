import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const serviceProviderId = searchParams.get("serviceProviderId")
    const search = searchParams.get("search")

    let query = supabaseAdmin
      .from("repair_tasks")
      .select(
        `
        id,
        task_number,
        device_id,
        device_info,
        issue_description,
        priority,
        status,
        service_provider_id,
        assigned_date,
        estimated_cost,
        actual_cost,
        work_started_at,
        work_completed_at,
        confirmed_at,
        repair_source,
        notes,
        created_at,
        updated_at,
        devices (
          id,
          device_name,
          device_type,
          brand,
          model,
          serial_number,
          location,
          assigned_to,
          profiles (
            full_name,
            email
          )
        ),
        service_providers (
          id,
          name,
          email,
          phone,
          location
        )
        `
      )
      .order("assigned_date", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (priority && priority !== "all") {
      query = query.eq("priority", priority)
    }

    if (serviceProviderId && serviceProviderId !== "all") {
      query = query.eq("service_provider_id", serviceProviderId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching all repairs:", error)
      return NextResponse.json(
        { error: "Failed to fetch repair tasks" },
        { status: 500 }
      )
    }

    let repairs = data || []

    // Apply search filter
    if (search && search.trim()) {
      const searchLower = search.toLowerCase()
      repairs = repairs.filter((r: any) => {
        const deviceInfo = r.device_info || {}
        const deviceName = r.devices?.device_name || ""
        const brand = deviceInfo.brand || ""
        const model = deviceInfo.model || ""
        const serialNumber = deviceInfo.serial_number || ""
        const taskNumber = r.task_number || ""
        const deviceType = deviceInfo.device_type || ""

        return (
          deviceName.toLowerCase().includes(searchLower) ||
          brand.toLowerCase().includes(searchLower) ||
          model.toLowerCase().includes(searchLower) ||
          serialNumber.toLowerCase().includes(searchLower) ||
          taskNumber.toLowerCase().includes(searchLower) ||
          deviceType.toLowerCase().includes(searchLower) ||
          r.issue_description?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Get statistics
    const stats = {
      total: repairs.length,
      byStatus: {
        assigned: repairs.filter((r: any) => r.status === "assigned").length,
        in_progress: repairs.filter((r: any) => r.status === "in_progress").length,
        completed: repairs.filter((r: any) => r.status === "completed").length,
        returned: repairs.filter((r: any) => r.status === "returned").length,
      },
      byPriority: {
        low: repairs.filter((r: any) => r.priority === "low").length,
        medium: repairs.filter((r: any) => r.priority === "medium").length,
        high: repairs.filter((r: any) => r.priority === "high").length,
        critical: repairs.filter((r: any) => r.priority === "critical").length,
      },
      pending: repairs.filter((r: any) => r.status === "assigned" || r.status === "in_progress").length,
    }

    return NextResponse.json({
      success: true,
      stats,
      count: repairs.length,
      repairs,
    })
  } catch (error: any) {
    console.error("[v0] Error in all repairs API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
