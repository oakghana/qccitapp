import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ticketId, newAssigneeId, newAssignee, reassignedBy, reassignedByName, reason } = body

    if (!ticketId || !newAssigneeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get current ticket info for audit
    const { data: ticket, error: fetchError } = await supabase
      .from("service_tickets")
      .select("*")
      .eq("id", ticketId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Update ticket with new assignee. Avoid writing additional reassignment
    // metadata fields here because some database deployments do not have
    // columns like `reassigned_at` / `reassigned_by` and attempting to write
    // them causes schema-cache errors. We record the audit below instead.
    const { data, error } = await supabase
      .from("service_tickets")
      .update({
        assigned_to: newAssigneeId,
        assigned_to_name: newAssignee,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select()
      .single()

    if (error) {
      console.error("Error reassigning ticket:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the reassignment action
    await supabase.from("audit_logs").insert({
      action: "ticket_reassigned",
      table_name: "service_tickets",
      record_id: ticketId,
      user_id: reassignedBy,
      user_name: reassignedByName,
      details: {
        from: ticket.assigned_to_name,
        to: newAssignee,
        reason: reason,
      },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, ticket: data })
  } catch (error) {
    console.error("Error in reassign endpoint:", error)
    return NextResponse.json({ error: "Failed to reassign ticket" }, { status: 500 })
  }
}
