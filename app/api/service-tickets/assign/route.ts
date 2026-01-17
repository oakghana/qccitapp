import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { ticketId, assignee, priority, dueDate, instructions, assignedBy } = body

    console.log("[v0] Assigning ticket:", ticketId, "to:", assignee)

    if (!ticketId || !assignee) {
      return NextResponse.json(
        { error: "Ticket ID and assignee are required" },
        { status: 400 }
      )
    }

    // Update the service ticket with assignment info
    const updateData: Record<string, any> = {
      assigned_to_name: assignee,
      status: "in_progress",
      priority: priority?.toLowerCase() || "medium",
      updated_at: new Date().toISOString(),
    }

    // Add due date if provided
    if (dueDate) {
      updateData.due_date = dueDate
    }

    // Add instructions/notes if provided
    if (instructions) {
      updateData.notes = instructions
    }

    // Add assigned by info
    if (assignedBy) {
      updateData.assigned_by = assignedBy
    }

    // Try to find ticket by ticket_number first, then by id
    let query = supabaseAdmin
      .from("service_tickets")
      .select("id, ticket_number")
      .or(`id.eq.${ticketId},ticket_number.eq.${ticketId}`)
      .limit(1)

    const { data: ticketData, error: findError } = await query

    if (findError) {
      console.error("[v0] Error finding ticket:", findError)
      return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    if (!ticketData || ticketData.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const dbTicketId = ticketData[0].id

    // Update the ticket
    const { data, error } = await supabaseAdmin
      .from("service_tickets")
      .update(updateData)
      .eq("id", dbTicketId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error assigning ticket:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Ticket assigned successfully:", data)

    // Create a ticket history/audit entry if the table exists
    try {
      await supabaseAdmin
        .from("ticket_history")
        .insert({
          ticket_id: dbTicketId,
          action: "assigned",
          description: `Ticket assigned to ${assignee} by ${assignedBy}`,
          created_by: assignedBy,
          created_at: new Date().toISOString(),
        })
    } catch (historyError) {
      // History table may not exist, that's okay
      console.log("[v0] Ticket history not recorded (table may not exist)")
    }

    return NextResponse.json({ 
      success: true, 
      ticket: data,
      message: `Ticket assigned to ${assignee}` 
    })
  } catch (error) {
    console.error("[v0] API Service Tickets Assign error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
