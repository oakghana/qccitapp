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

    const { data: transactions, error } = await supabase
      .from('stock_transactions')
      .select('*')
      .eq('location', location)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[v0] Error fetching transactions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
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
