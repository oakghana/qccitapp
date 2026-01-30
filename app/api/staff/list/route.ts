import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'all'
    const location = searchParams.get('location') || 'all'

    const supabase = await createServerClient()

    // Build query to fetch users with IT-related roles
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, location, department, status')

    // Filter by role if specified
    if (role && role !== 'all') {
      const roles = [
        'it_staff',
        'it_head',
        'regional_it_head',
        'service_desk_head',
        'service_desk_staff',
      ]
      
      if (role === 'staff_roles') {
        query = query.in('role', ['it_staff', 'service_desk_staff', 'regional_it_head'])
      } else if (roles.includes(role)) {
        query = query.eq('role', role)
      }
    } else {
      // Default to IT and service desk staff
      query = query.in('role', [
        'it_staff',
        'it_head',
        'regional_it_head',
        'service_desk_head',
        'service_desk_staff',
        'admin',
      ])
    }

    // Filter by location if specified
    if (location && location !== 'all') {
      const normalizedLocation = location.toLowerCase()
      // This will be filtered in the app since PostgREST doesn't support case-insensitive LIKE easily
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

    console.log(`[v0] Fetched ${filtered.length} IT staff members`)

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
