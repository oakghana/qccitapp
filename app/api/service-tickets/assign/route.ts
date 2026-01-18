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

    const { ticketId, assigneeId, assignee, priority, dueDate, instructions, assignedBy, assignedById } = body

    console.log("[v0] Assigning ticket:", ticketId, "to:", assignee, "(ID:", assigneeId, ")")

    if (!ticketId || (!assignee && !assigneeId)) {
      return NextResponse.json(
        { error: "Ticket ID and assignee are required" },
        { status: 400 }
      )
    }

    // Update the service ticket with assignment info
    const updateData: Record<string, any> = {
      assigned_to: assigneeId, // Store user ID for querying
      assigned_to_name: assignee, // Store name for display
      status: "in_progress",
      priority: priority?.toLowerCase() || "medium",
      updated_at: new Date().toISOString(),
      assigned_at: new Date().toISOString(),
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

    // Only query id if ticketId is a valid UUID, else use ticket_number
    function isUUID(str: string) {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
    }

    let ticketData, findError, dbTicketId
    if (isUUID(ticketId)) {
      // Search by id (UUID)
      ({ data: ticketData, error: findError } = await supabaseAdmin
        .from("service_tickets")
        .select("id, ticket_number")
        .eq("id", ticketId)
        .limit(1)
      )
    } else {
      // Search by ticket_number (string)
      ({ data: ticketData, error: findError } = await supabaseAdmin
        .from("service_tickets")
        .select("id, ticket_number")
        .eq("ticket_number", ticketId)
        .limit(1)
      )
    }

    if (findError) {
      console.error("[v0] Error finding ticket:", findError)
      return NextResponse.json({ error: findError.message }, { status: 500 })
    }

    if (!ticketData || ticketData.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    dbTicketId = ticketData[0].id

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

    // Create a ticket update/audit entry using the correct table
    try {
      await supabaseAdmin
        .from("service_ticket_updates")
        .insert({
          ticket_id: dbTicketId,
          update_type: "assignment",
          old_status: "open",
          new_status: "in_progress",
          new_assignee: assigneeId,
          notes: `Ticket assigned to ${assignee} by ${assignedBy}. Instructions: ${instructions || "None"}`,
          created_by: assignedById || assigneeId,
          created_by_name: assignedBy,
          is_internal: false,
        })
    } catch (updateError) {
      // History update may fail, but don't block the assignment
      console.warn("[v0] Could not record ticket update:", updateError)
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
