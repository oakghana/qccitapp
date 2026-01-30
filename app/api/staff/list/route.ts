import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'all'
    const location = searchParams.get('location') || 'all'
    const userRole = searchParams.get('userRole') // The role of the requesting user

    const supabase = await createServerClient()

    // Build query to fetch users with IT-related roles
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, location, department, status')

    // Determine which roles to fetch based on requesting user's role
    let rolesToFetch = [
      'it_staff',
      'it_head',
      'regional_it_head',
      'service_desk_head',
      'service_desk_staff',
    ]

    // Service desk head can see ALL IT staff
    if (userRole === 'service_desk_head') {
      rolesToFetch = [
        'it_staff',
        'it_head',
        'regional_it_head',
        'service_desk_head',
        'service_desk_staff',
        'store_head',
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
        // For ticket assignment, service desk head can assign to all IT staff
        if (userRole === 'service_desk_head') {
          query = query.in('role', [
            'it_staff',
            'it_head',
            'regional_it_head',
            'service_desk_staff',
            'store_head',
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

    console.log(`[v0] Fetched ${filtered.length} IT staff members for role: ${userRole}`)

    return NextResponse.json({
      staff: filtered.map(s => ({
        id: s.id,
        name: s.full_name,
        email: s.email,
        phone: s.phone,
        role: s.role,
        location: s.location,
        department: s.department,
        isOnline: s.status === 'online',
      })),
    })
  } catch (error: any) {
    console.error('[v0] Exception in staff list:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
