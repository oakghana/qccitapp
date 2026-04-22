import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function GET(req: NextRequest) {
  try {
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
        devices: [],
      })
    }

    // Fetch all devices in the department
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('department', headData.department)
      .order('device_name', { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      devices: data || [],
    })
  } catch (err) {
    console.error('[v0] Department devices API error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch department devices' },
      { status: 500 }
    )
  }
}
