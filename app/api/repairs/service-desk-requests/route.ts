import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const isDepartmentView = searchParams.get('department') === 'true'

    if (!isDepartmentView) {
      return NextResponse.json(
        { success: false, error: 'Invalid request' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('sb-auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Verify and get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Fetch department head's department
    const { data: headData, error: headError } = await supabase
      .from('profiles')
      .select('department')
      .eq('id', user.id)
      .single()

    if (headError || !headData?.department) {
      // Return empty array if no department found
      return NextResponse.json({
        success: true,
        requests: [],
      })
    }

    // Fetch service desk requests for the department
    const { data, error } = await supabase
      .from('service_desk_tickets')
      .select('*')
      .eq('department', headData.department)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      requests: data || [],
    })
  } catch (err) {
    console.error('[v0] Service desk requests API error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service desk requests' },
      { status: 500 }
    )
  }
}
