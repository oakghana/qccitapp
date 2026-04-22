import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ticketId, completedBy, completedByName, completedByRole, workNotes } = body

    if (!ticketId) {
      return NextResponse.json(
        { error: "Missing ticket ID" },
        { status: 400 }
      )
    }

    // Get current ticket info - support either UUID or ticket number in case
    // the frontend accidentally passed the human-readable number.
    let ticket
    let fetchError

    // attempt simple lookup by id first, then fall back to ticket_number
    ({ data: ticket, error: fetchError } = await supabase
      .from("service_tickets")
      .select("*")
      .or(`id.eq.${ticketId},ticket_number.eq.${ticketId}`)
      .single())

    if (fetchError || !ticket) {
      console.warn("[v0] Complete route could not find ticket", ticketId, fetchError)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Mark ticket as waiting for user confirmation
    const { data, error } = await supabase
      .from("service_tickets")
      .update({
        status: "awaiting_confirmation",
        completed_at: new Date().toISOString(),
        completed_by: completedBy,
        completed_by_name: completedByName,
        completed_by_role: completedByRole,
        completion_work_notes: workNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select()
      .single()

    if (error) {
      console.error("Error marking ticket as completed:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the completion action
    await supabase.from("audit_logs").insert({
      action: "ticket_completion_submitted",
      table_name: "service_tickets",
      record_id: ticketId,
      user_id: completedBy,
      user_name: completedByName,
      details: {
        status: "awaiting_user_confirmation",
        work_notes: workNotes,
      },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, ticket: data })
  } catch (error) {
    console.error("Error in complete endpoint:", error)
    return NextResponse.json({ error: "Failed to mark ticket as completed" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { ticketId, confirmedBy, confirmedByName, confirmation, confirmationNotes } = body

    if (!ticketId) {
      return NextResponse.json(
        { error: "Missing ticket ID" },
        { status: 400 }
      )
    }

    const finalStatus = confirmation === "approved" ? "resolved" : "reopen"

    // Update ticket with user confirmation
    const { data, error } = await supabase
      .from("service_tickets")
      .update({
        status: finalStatus,
        user_confirmed: true,
        user_confirmed_at: new Date().toISOString(),
        user_confirmed_by: confirmedBy,
        confirmation_status: confirmation,
        confirmation_notes: confirmationNotes,
        completion_confirmation_notes: confirmationNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select()
      .single()

    if (error) {
      console.error("Error confirming ticket completion:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the confirmation action
    await supabase.from("audit_logs").insert({
      action: "ticket_user_confirmed",
      table_name: "service_tickets",
      record_id: ticketId,
      user_id: confirmedBy,
      user_name: confirmedByName,
      details: {
        confirmation: confirmation,
        notes: confirmationNotes,
        final_status: finalStatus,
      },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, ticket: data })
  } catch (error) {
    console.error("Error in confirmation endpoint:", error)
    return NextResponse.json({ error: "Failed to confirm ticket" }, { status: 500 })
  }
}
