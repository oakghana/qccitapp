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
    const location = searchParams.get("location") || ""
    const canSeeAll = searchParams.get("canSeeAll") === "true"
    const userId = searchParams.get("userId")
    const userRole = searchParams.get("userRole")

    console.log("[v0] API Service Tickets - location:", location, "canSeeAll:", canSeeAll, "role:", userRole)

    // Fetch all tickets first, then filter in memory for reliability
    const { data, error } = await supabaseAdmin
      .from("service_tickets")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading service tickets:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let filteredData = data || []

    // Apply filters based on user role
    if (userRole === "user" || userRole === "staff") {
      // Regular users only see their own tickets
      if (userId) {
        filteredData = filteredData.filter(t => 
          t.requested_by?.toLowerCase() === userId.toLowerCase()
        )
      }
    } else if (userRole === "admin" || userRole === "it_head") {
      // Admin and IT Head see all tickets - no filter
      console.log("[v0] Admin/IT Head - showing all tickets")
    } else if (userRole === "regional_it_head" || userRole === "service_desk_head") {
      // Regional IT Head and Service Desk Head see tickets from their region/location
      // They should see tickets matching their location or locations in the same region
      const loc = location.toLowerCase().trim()
      
      if (loc) {
        // Get the first significant word for regional matching
        const locParts = loc.split(/[\s,]+/).filter(p => p.length > 2)
        const regionKey = locParts[0] || loc
        
        filteredData = filteredData.filter(t => {
          const ticketLoc = (t.location || "").toLowerCase().trim()
          // Exact match
          if (ticketLoc === loc) return true
          // Location contains user location
          if (ticketLoc.includes(loc) || loc.includes(ticketLoc)) return true
          // Regional matching - same region/city
          const ticketParts = ticketLoc.split(/[\s,]+/).filter((p: string) => p.length > 2)
          const ticketRegionKey = ticketParts[0] || ticketLoc
          if (regionKey === ticketRegionKey && regionKey.length > 3) return true
          return false
        })
      }
      console.log("[v0] Regional/Service Desk Head - filtered to", filteredData.length, "tickets for", location)
    } else if (!canSeeAll && location) {
      // Other IT staff see tickets for their specific location
      const loc = location.toLowerCase().trim()
      filteredData = filteredData.filter(t => {
        const ticketLoc = (t.location || "").toLowerCase().trim()
        // Exact match
        if (ticketLoc === loc) return true
        // Location contains user location
        if (ticketLoc.includes(loc) || loc.includes(ticketLoc)) return true
        return false
      })
    }
    // If canSeeAll is true, no location filter is applied

    console.log("[v0] Loaded service tickets:", filteredData.length, "of", data?.length || 0, "total")

    return NextResponse.json({ tickets: filteredData })
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
        office_number: body.office_number || '',
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: "Missing ticket id" }, { status: 400 })
    }

    // Fetch existing ticket
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("service_tickets")
      .select("*")
      .eq("id", body.id)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching ticket for update:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Authorization: allow if requester matches or role provided is admin/it_head
    const actingRole = body.userRole || ""
    const actingUser = (body.requested_by || "").toString()

    const isOwner = existing.requested_by && actingUser && existing.requested_by.toLowerCase() === actingUser.toLowerCase()
    const allowedRole = actingRole === "admin" || actingRole === "it_head"

    if (!isOwner && !allowedRole) {
      return NextResponse.json({ error: "Not authorized to update this ticket" }, { status: 403 })
    }

    // Prepare updates - only allow certain fields from user edits
    const updates: any = {}
    if (typeof body.title === "string") updates.title = body.title
    if (typeof body.description === "string") updates.description = body.description
    if (typeof body.priority === "string") updates.priority = body.priority.toLowerCase()
    if (typeof body.category === "string") updates.category = body.category
    if (typeof body.location === "string") updates.location = body.location
    if (typeof body.office_number === "string") updates.office_number = body.office_number
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from("service_tickets")
      .update(updates)
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating service ticket:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ticket: data })
  } catch (error) {
    console.error("[v0] API Service Tickets PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: "Missing ticket id" }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("service_tickets")
      .select("*")
      .eq("id", body.id)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching ticket for delete:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const actingRole = body.userRole || ""
    const actingUser = (body.requested_by || "").toString()

    const isOwner = existing.requested_by && actingUser && existing.requested_by.toLowerCase() === actingUser.toLowerCase()
    const allowedRole = actingRole === "admin" || actingRole === "it_head"

    // Prevent deletion if ticket is already assigned to an IT staff - only admin/it_head can delete
    const isAssigned = !!(existing.assigned_to || existing.assigned_to_name || existing.assigned_to_id)

    if (!isOwner && !allowedRole) {
      return NextResponse.json({ error: "Not authorized to delete this ticket" }, { status: 403 })
    }

    if (isAssigned && !allowedRole) {
      return NextResponse.json({ error: "Cannot delete a ticket that has been assigned to staff" }, { status: 403 })
    }

    const { error } = await supabaseAdmin.from("service_tickets").delete().eq("id", body.id)

    if (error) {
      console.error("[v0] Error deleting service ticket:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] API Service Tickets DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
