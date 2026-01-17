import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location")
    const canSeeAll = searchParams.get("canSeeAll") === "true"
    const userId = searchParams.get("userId")
    const userRole = searchParams.get("userRole")

    console.log("[v0] API Service Tickets - location:", location, "canSeeAll:", canSeeAll, "role:", userRole)

    let query = supabaseAdmin
      .from("service_tickets")
      .select("*")
      .order("created_at", { ascending: false })

    // Apply filters based on user role
    if (userRole === "user" || userRole === "staff") {
      // Regular users only see their own tickets
      if (userId) {
        query = query.eq("requested_by", userId)
      }
    } else if (!canSeeAll && location) {
      // IT staff see tickets for their location
      query = query.or(`location.ilike.${location},location.ilike.${location.toLowerCase()},location.ilike.${location.toUpperCase()}`)
    }
    // If canSeeAll is true, no location filter is applied

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error loading service tickets:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Loaded service tickets:", data?.length || 0)

    return NextResponse.json({ tickets: data || [] })
  } catch (error) {
    console.error("[v0] API Service Tickets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Creating service ticket:", body)

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`

    // Map category to valid enum values
    // Database enum: 'hardware', 'software', 'network', 'printer', 'access', 'other'
    const categoryMap: Record<string, string> = {
      'hardware': 'hardware',
      'software': 'software',
      'network': 'network',
      'printer': 'printer',
      'access': 'access',
      'account': 'access', // Map account to access
      'mobile': 'hardware', // Map mobile to hardware
      'other': 'other',
    }
    
    const rawCategory = (body.category || '').toLowerCase().trim()
    const mappedCategory = categoryMap[rawCategory] || 'other'

    console.log("[v0] Category mapping:", body.category, "->", mappedCategory)

    const { data, error } = await supabaseAdmin
      .from("service_tickets")
      .insert({
        ticket_number: ticketNumber,
        title: body.title || 'IT Support Request',
        description: body.description || '',
        category: mappedCategory,
        priority: body.priority?.toLowerCase() || "medium",
        status: "open",
        location: body.location || '',
        requested_by: body.requested_by || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating service ticket:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Created service ticket:", data)

    return NextResponse.json({ ticket: data })
  } catch (error) {
    console.error("[v0] API Service Tickets POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
