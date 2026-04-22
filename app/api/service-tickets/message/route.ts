import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ticketId, userId, userName, userRole, message } = body

    if (!ticketId || !userId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify ticket exists
    const { data: ticket, error: ticketError } = await supabase
      .from("service_tickets")
      .select("id, location_id")
      .eq("id", ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Insert message
    const { data, error } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        message: message,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the action
    await supabase.from("audit_logs").insert({
      action: "ticket_message_sent",
      table_name: "ticket_messages",
      record_id: data.id,
      user_id: userId,
      user_name: userName,
      details: {
        ticket_id: ticketId,
        message_preview: message.substring(0, 100),
      },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, message: data })
  } catch (error) {
    console.error("Error in message endpoint:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get("ticketId")

    if (!ticketId) {
      return NextResponse.json(
        { error: "Missing ticketId parameter" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: data })
  } catch (error) {
    console.error("Error in get messages endpoint:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}
