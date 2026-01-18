import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function PATCH(request: NextRequest) {
  try {
    console.log("[v0] Service tickets update API called with request:", request.method, request.url)

    const body = await request.json()
    const { id, status, work_notes, actual_hours, completed_at } = body

    console.log("[v0] Updating service ticket:", id, { status, work_notes, actual_hours, completed_at })

    if (!id) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    // Map task status to service ticket status
    const statusMap: Record<string, string> = {
      assigned: "open",
      in_progress: "in_progress",
      completed: "resolved",
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
      updateData.resolved_at = completed_at || new Date().toISOString()
    }

    console.log("[v0] Update data prepared:", updateData)

    const { data, error } = await supabaseAdmin
      .from("service_tickets")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating service ticket:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Service ticket updated successfully:", data)
    console.log("[v0] Verifying update - checking if work_notes was updated:", data.work_notes)

    return NextResponse.json({ success: true, ticket: data })
  } catch (error) {
    console.error("[v0] API Service Tickets Update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
