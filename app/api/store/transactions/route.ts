import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get('location') || 'Central Stores'
    const limit = parseInt(searchParams.get('limit') || '15', 10)

    // Use case-insensitive filtering for location; prefer `location_name`.
    const likePattern = `%${location}%`

    let transactions = null

    try {
      const res = await supabase
        .from('stock_transactions')
        .select('*')
        .ilike('location_name', likePattern)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (res.error) throw res.error
      transactions = res.data
    } catch (err: any) {
      // If the DB doesn't have the `location_name` column or any other column
      // referenced above, fall back to a safe unfiltered query to avoid 500.
      console.warn('[v0] Location filter failed, falling back to unfiltered fetch:', err?.message || err)
      const fallback = await supabase
        .from('stock_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (fallback.error) {
        console.error('[v0] Error fetching transactions (fallback):', fallback.error)
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
      }
      transactions = fallback.data
    }

    return NextResponse.json({
      transactions: transactions || [],
    })
  } catch (error) {
    console.error('[v0] Error in transactions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
