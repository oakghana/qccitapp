'use server'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch recent stock additions from stock_transactions table
    const { data: additions, error } = await supabase
      .from('stock_transactions')
      .select('item_id, item_name, quantity, location, created_at')
      .eq('transaction_type', 'addition')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('[v0] Error fetching stock additions:', error)
      return NextResponse.json({ additions: [] })
    }

    // Enrich with category and location info
    const enrichedAdditions = (additions || []).map(addition => ({
      id: `${addition.item_id}-${addition.created_at}`,
      item_name: addition.item_name,
      quantity: addition.quantity,
      category: 'IT Accessories', // Default category - could be fetched from store_items
      location: addition.location || 'Central Stores',
      created_at: addition.created_at,
      created_by: 'System',
    }))

    return NextResponse.json({ additions: enrichedAdditions })
  } catch (error) {
    console.error('[v0] Error in stock-additions API:', error)
    return NextResponse.json({ additions: [] })
  }
}
