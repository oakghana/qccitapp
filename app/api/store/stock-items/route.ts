import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('central_store_items')
      .select('*')
      .order('item_name', { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      items: data || [],
    })
  } catch (err) {
    console.error('[v0] Stock items API error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock items' },
      { status: 500 }
    )
  }
}
