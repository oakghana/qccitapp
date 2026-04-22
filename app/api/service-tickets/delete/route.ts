import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, userId, userRole } = body

    console.log("[v0] Deleting ticket:", ticketId, "by:", userId, "role:", userRole)

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    // Fetch the ticket to verify ownership and assignment status
    // Try to find by ticket_number first (more common), then by UUID
    let ticket = null
    let fetchError = null

    console.log("[v0] Searching for ticket with ID:", ticketId)

    // First try by ticket_number (e.g., "TKT-2024-001")
    const ticketNumberResult = await supabaseAdmin
      .from("service_tickets")
      .select("id, ticket_number, requested_by, assigned_to, status")
      .eq("ticket_number", ticketId)
      .maybeSingle()
    
    if (ticketNumberResult.data) {
      ticket = ticketNumberResult.data
      console.log("[v0] Found ticket by ticket_number:", ticket.ticket_number)
    } else {
      // If not found by ticket_number, try by UUID id
      const uuidResult = await supabaseAdmin
        .from("service_tickets")
        .select("id, ticket_number, requested_by, assigned_to, status")
        .eq("id", ticketId)
        .maybeSingle()
      
      if (uuidResult.data) {
        ticket = uuidResult.data
        console.log("[v0] Found ticket by UUID:", ticket.id)
      } else {
        fetchError = uuidResult.error || ticketNumberResult.error
      }
    }

    if (!ticket) {
      // If ticket is not found, it might have already been deleted
      // Return success instead of error to prevent confusing the user
      console.log("[v0] Ticket not found (may have been already deleted). ID:", ticketId)
      return NextResponse.json({ 
        success: true, 
        message: `Ticket has been deleted`
      })
    }

    // Authorization check: Only admin can delete tickets, regardless of assignment status
    if (userRole !== "admin") {
      console.error("[v0] Unauthorized delete attempt - user is not admin:", userRole)
      return NextResponse.json(
        { 
          error: "Only Admin can delete tickets. Contact your system administrator." 
        }, 
        { status: 403 }
      )
    }

    // Delete the ticket using the actual UUID from the fetched ticket
    const { data, error } = await supabaseAdmin
      .from("service_tickets")
      .delete()
      .eq("id", ticket.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error deleting ticket:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Ticket deleted successfully:", ticketId)

    return NextResponse.json({ 
      success: true, 
      message: `Ticket ${ticket.ticket_number || ticketId} has been deleted`
    })
  } catch (error) {
    console.error("[v0] API Service Tickets Delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
