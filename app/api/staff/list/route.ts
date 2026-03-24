import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'all'
    const location = searchParams.get('location') || 'all'
    const userRole = searchParams.get('userRole') // The role of the requesting user
    const allUsers = searchParams.get('allUsers') === 'true' // Return all users with active status

    console.log('[v0] Staff list API called - role:', role, 'location:', location, 'userRole:', userRole, 'allUsers:', allUsers)

    // If allUsers is requested, return from app_users table instead of profiles
    if (allUsers) {
      console.log('[v0] Fetching all users from app_users table')
      
      const { data: users, error } = await supabaseAdmin
        .from('app_users')
        .select('id, full_name, email, is_active, created_at')
        .order('full_name', { ascending: true })

      if (error) {
        console.error('[v0] Error fetching app users:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log(`[v0] Fetched ${users?.length || 0} users from app_users`)

      return NextResponse.json({
        staff: (users || []).map(u => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          is_active: u.is_active,
          department: '',
          location: '',
          role: '',
          isOnline: true,
          currentTickets: 0,
          isAvailable: true,
        })),
      })
    }

    // Build query to fetch users with IT-related roles
    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, phone, role, location, department, status')
      .eq('status', 'approved') // Only show approved users (valid values: pending, approved, rejected)

    // Determine which roles to fetch based on requesting user's role
    let rolesToFetch = [
      'it_staff',
      'it_head',
      'regional_it_head',
      'service_desk_head',
      'service_desk_staff',
    ]

    // Service desk head and admin can see ALL IT staff
    if (userRole === 'service_desk_head' || userRole === 'admin' || userRole === 'it_head') {
      rolesToFetch = [
        'it_staff',
        'it_head',
        'regional_it_head',
        'service_desk_head',
        'service_desk_staff',
      ]
    }

    // Regional IT heads should also see themselves in the list (for self-assignment)
    // and IT staff in their region
    if (userRole === 'regional_it_head') {
      rolesToFetch = [
        'it_staff',
        'regional_it_head',
        'service_desk_staff',
      ]
    }

    // Filter by role if specified
    if (role && role !== 'all') {
      // Special-case: return all approved users except admin when `all_users` requested
      if (role === 'all_users') {
        query = query.neq('role', 'admin')
      } else {
        const staffRoles = [
          'it_staff',
          'it_head',
          'regional_it_head',
          'service_desk_head',
          'service_desk_staff',
        ]
        
        if (role === 'staff_roles') {
          // For ticket assignment, admins and heads can assign to all IT staff
          if (userRole === 'service_desk_head' || userRole === 'admin' || userRole === 'it_head') {
            query = query.in('role', [
              'it_staff',
              'it_head',
              'regional_it_head',
              'service_desk_staff',
            ])
          } else if (userRole === 'regional_it_head') {
            // Regional IT heads can assign to IT staff and themselves
            query = query.in('role', ['it_staff', 'service_desk_staff', 'regional_it_head'])
          } else {
            query = query.in('role', ['it_staff', 'service_desk_staff', 'regional_it_head'])
          }
        } else if (staffRoles.includes(role)) {
          query = query.eq('role', role)
        }
      }
    } else {
      query = query.in('role', rolesToFetch)
    }

    const { data: staff, error } = await query.order('full_name', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching IT staff:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get active ticket counts for each staff member
    const { data: tickets } = await supabaseAdmin
      .from('service_tickets')
      .select('assigned_to_id, status')
      .in('status', ['Open', 'In Progress', 'Pending'])

    // Count tickets per staff member
    const ticketCounts: Record<string, number> = {}
    tickets?.forEach((ticket) => {
      if (ticket.assigned_to_id) {
        ticketCounts[ticket.assigned_to_id] = (ticketCounts[ticket.assigned_to_id] || 0) + 1
      }
    })

    console.log('[v0] Active ticket counts by staff:', ticketCounts)

    // Filter by location in application code if needed
    let filtered = staff || []
    if (location && location !== 'all') {
      const normalizedLocation = location.toLowerCase()
      filtered = filtered.filter(s =>
        (s.location || '').toLowerCase().includes(normalizedLocation) ||
        normalizedLocation.includes((s.location || '').toLowerCase())
      )
    }

    // Check if we should exclude staff with active assignments
    const excludeAssigned = searchParams.get('excludeAssigned') === 'true'
    if (excludeAssigned) {
      // Filter out staff who have any active tickets
      filtered = filtered.filter(s => !ticketCounts[s.id] || ticketCounts[s.id] === 0)
      console.log(`[v0] After filtering assigned staff: ${filtered.length} available`)
    }

    console.log(`[v0] Fetched ${filtered.length} IT staff members for role: ${userRole}, location: ${location}`)

    return NextResponse.json({
      staff: filtered.map(s => {
        const activeTickets = ticketCounts[s.id] || 0
        return {
          id: s.id,
          name: s.full_name,
          email: s.email,
          phone: s.phone,
          role: s.role,
          location: s.location,
          department: s.department,
          isOnline: true,
          currentTickets: activeTickets,
          isAvailable: activeTickets === 0, // Available only if no active tickets
        }
      }),
    })
  } catch (error: any) {
    console.error('[v0] Exception in staff list:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
