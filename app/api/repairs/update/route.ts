import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, work_notes, actual_hours, completed_at } = body

    if (!id) {
      return NextResponse.json({ error: "Repair request ID is required" }, { status: 400 })
    }

    console.log("[v0] Updating repair request:", id, { status, work_notes, actual_hours })

    // Map task status to repair request status
    const statusMap: Record<string, string> = {
      assigned: "assigned",
      in_progress: "in_progress",
      completed: "completed",
      on_hold: "on_hold",
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updateData.status = statusMap[status] || status
    }

    if (work_notes) {
      updateData.work_notes = work_notes
    }

    if (actual_hours !== undefined) {
      updateData.actual_hours = actual_hours
    }

    if (completed_at || status === "completed") {
      updateData.completed_at = completed_at || new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from("repair_requests")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating repair request:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Updated repair request:", data)

    return NextResponse.json({ success: true, repair: data })
  } catch (error) {
    console.error("[v0] API Repairs Update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
