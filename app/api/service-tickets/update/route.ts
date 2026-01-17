import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, workNotes, actualHours } = body
    if (!id) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    }
    if (workNotes) updateData.work_notes = workNotes
    if (actualHours !== undefined) updateData.actual_hours = actualHours
    if (status === "completed") updateData.resolved_at = new Date().toISOString()
    const { data, error } = await supabaseAdmin
      .from("service_tickets")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ticket: data })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
