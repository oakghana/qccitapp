import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userRole = searchParams.get("userRole")
    const userLocation = searchParams.get("userLocation")

    if (!userRole) {
      return NextResponse.json(
        { error: "Missing userRole parameter" },
        { status: 400 }
      )
    }

    // Calculate the threshold date (1 day ago)
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - 1)

    // Query for delayed tickets
    let query = supabase
      .from("service_tickets")
      .select("*")
      .eq("status", "open")
      .lt("due_date", thresholdDate.toISOString())

    // Filter by location if provided and user is not admin/head
    if (userLocation && !["admin", "it_head", "service_desk_head"].includes(userRole)) {
      query = query.eq("location_id", userLocation)
    }

    const { data: tickets, error } = await query

    if (error) {
      console.error("Error fetching delayed tickets:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Check if alerts have been sent for these tickets
    const { data: alertedTickets, error: alertError } = await supabase
      .from("delayed_ticket_alerts")
      .select("ticket_id")
      .eq("is_active", true)

    if (alertError) {
      console.error("Error fetching alerted tickets:", error)
      return NextResponse.json({ error: alertError.message }, { status: 500 })
    }

    const alertedIds = new Set(alertedTickets?.map(t => t.ticket_id) || [])

    // Filter to only include tickets that haven't been alerted yet
    const newDelayedTickets = tickets?.filter(t => !alertedIds.has(t.id)) || []

    // Create alerts for new delayed tickets
    if (newDelayedTickets.length > 0) {
      const alertsToInsert = newDelayedTickets.map(ticket => ({
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        requester_id: ticket.requester_id,
        requester_name: ticket.requester_name,
        assigned_to: ticket.assigned_to,
        assigned_to_name: ticket.assigned_to_name,
        location_id: ticket.location_id,
        is_active: true,
        created_at: new Date().toISOString(),
      }))

      await supabase
        .from("delayed_ticket_alerts")
        .insert(alertsToInsert)
    }

    return NextResponse.json({
      delayedTickets: newDelayedTickets,
      count: newDelayedTickets.length,
    })
  } catch (error) {
    console.error("Error in delayed tickets endpoint:", error)
    return NextResponse.json({ error: "Failed to fetch delayed tickets" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { ticketId } = body

    if (!ticketId) {
      return NextResponse.json(
        { error: "Missing ticketId" },
        { status: 400 }
      )
    }

    // Mark alert as inactive/resolved
    const { data, error } = await supabase
      .from("delayed_ticket_alerts")
      .update({ is_active: false })
      .eq("ticket_id", ticketId)
      .select()

    if (error) {
      console.error("Error updating alert:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, alert: data })
  } catch (error) {
    console.error("Error in update alert endpoint:", error)
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 })
  }
}
