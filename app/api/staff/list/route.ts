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

    console.log('[v0] Staff list API called - role:', role, 'location:', location, 'userRole:', userRole)

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

    // Filter by role if specified
    if (role && role !== 'all') {
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
        } else {
          query = query.in('role', ['it_staff', 'service_desk_staff', 'regional_it_head'])
        }
      } else if (staffRoles.includes(role)) {
        query = query.eq('role', role)
      }
    } else {
      query = query.in('role', rolesToFetch)
    }

    const { data: staff, error } = await query.order('full_name', { ascending: true })

    if (error) {
      console.error('[v0] Error fetching IT staff:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter by location in application code if needed
    let filtered = staff || []
    if (location && location !== 'all') {
      const normalizedLocation = location.toLowerCase()
      filtered = filtered.filter(s =>
        (s.location || '').toLowerCase().includes(normalizedLocation) ||
        normalizedLocation.includes((s.location || '').toLowerCase())
      )
    }

    console.log(`[v0] Fetched ${filtered.length} IT staff members for role: ${userRole}, location: ${location}`)

    return NextResponse.json({
      staff: filtered.map(s => ({
        id: s.id,
        name: s.full_name,
        email: s.email,
        phone: s.phone,
        role: s.role,
        location: s.location,
        department: s.department,
        isOnline: true, // All approved users are considered available
      })),
    })
  } catch (error: any) {
    console.error('[v0] Exception in staff list:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
