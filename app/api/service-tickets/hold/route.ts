import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ticketId, holdReason, heldBy, heldByName, heldByRole } = body

    if (!ticketId) {
      return NextResponse.json(
        { error: "Missing ticket ID" },
        { status: 400 }
      )
    }

    // Update ticket to hold status
    const { data, error } = await supabase
      .from("service_tickets")
      .update({
        status: "on_hold",
        hold_reason: holdReason,
        held_at: new Date().toISOString(),
        held_by: heldBy,
        held_by_name: heldByName,
        held_by_role: heldByRole,
        is_productivity_exempt: true, // Exclude from productivity metrics
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select()
      .single()

    if (error) {
      console.error("Error holding ticket:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the hold action
    await supabase.from("audit_logs").insert({
      action: "ticket_held",
      table_name: "service_tickets",
      record_id: ticketId,
      user_id: heldBy,
      user_name: heldByName,
      details: {
        reason: holdReason,
        role: heldByRole,
      },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, ticket: data })
  } catch (error) {
    console.error("Error in hold endpoint:", error)
    return NextResponse.json({ error: "Failed to hold ticket" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { ticketId, resumedBy, resumedByName } = body

    if (!ticketId) {
      return NextResponse.json(
        { error: "Missing ticket ID" },
        { status: 400 }
      )
    }

    // Update ticket to resume from hold
    const { data, error } = await supabase
      .from("service_tickets")
      .update({
        status: "in_progress",
        hold_reason: null,
        is_productivity_exempt: false,
        resumed_at: new Date().toISOString(),
        resumed_by: resumedBy,
        resumed_by_name: resumedByName,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select()
      .single()

    if (error) {
      console.error("Error resuming ticket:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the resume action
    await supabase.from("audit_logs").insert({
      action: "ticket_resumed",
      table_name: "service_tickets",
      record_id: ticketId,
      user_id: resumedBy,
      user_name: resumedByName,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, ticket: data })
  } catch (error) {
    console.error("Error in resume endpoint:", error)
    return NextResponse.json({ error: "Failed to resume ticket" }, { status: 500 })
  }
}
