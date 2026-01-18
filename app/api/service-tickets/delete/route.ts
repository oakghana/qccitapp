import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
    const { data: ticket, error: fetchError } = await supabaseAdmin
      .from("service_tickets")
      .select("id, ticket_number, requested_by, assigned_to, status")
      .eq("id", ticketId)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching ticket:", fetchError)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Authorization checks:
    // 1. Ticket creator can delete if ticket is unassigned
    // 2. Admin and IT Head can always delete
    const isCreator = ticket.requested_by?.toLowerCase() === userId?.toLowerCase()
    const canAlwaysDelete = userRole === "admin" || userRole === "it_head"
    const isUnassigned = !ticket.assigned_to

    if (!canAlwaysDelete && (!isCreator || !isUnassigned)) {
      console.error("[v0] Unauthorized delete attempt - not creator or ticket is assigned")
      return NextResponse.json(
        { 
          error: "You can only delete your own unassigned tickets. Contact IT Head or Admin to delete assigned tickets." 
        }, 
        { status: 403 }
      )
    }

    // Delete the ticket
    const { data, error } = await supabaseAdmin
      .from("service_tickets")
      .delete()
      .eq("id", ticketId)
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
