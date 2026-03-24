import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const {
      full_name,
      email,
      user_role, // The role of the requesting user
    } = await request.json()

    console.log('[v0] Create user endpoint - called by role:', user_role)

    // Check if user has permission to create users
    const allowedRoles = ['admin', 'it_store_head', 'regional_it_head']
    if (!allowedRoles.includes(user_role)) {
      return NextResponse.json(
        { error: 'You do not have permission to create new users' },
        { status: 403 }
      )
    }

    // Validate input
    if (!full_name || !full_name.trim()) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      )
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('app_users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Create new user in app_users table with is_active = true
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('app_users')
      .insert([
        {
          full_name: full_name.trim(),
          email: email.toLowerCase().trim(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (createError) {
      console.error('[v0] Error creating user:', createError)
      return NextResponse.json(
        { error: createError.message || 'Failed to create user' },
        { status: 500 }
      )
    }

    console.log('[v0] Successfully created new user:', newUser.id)

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.full_name,
        email: newUser.email,
        is_active: newUser.is_active,
      },
      message: `User "${full_name}" has been created successfully and is active`,
    })
  } catch (error: any) {
    console.error('[v0] Exception in users/create:', error.message)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
