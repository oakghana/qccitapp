'use server'

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch all transactions across all locations
    const { data: transactions, error } = await supabase
      .from('stock_transactions')
      .select('id, item_name, transaction_type, quantity, location_name, reference_type, created_at')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('[v0] Error fetching transactions:', error)
      return NextResponse.json({ transactions: [] })
    }

    const processedTransactions = (transactions || []).map(txn => ({
      id: txn.id,
      item_name: txn.item_name,
      transaction_type: txn.transaction_type || 'Unknown',
      quantity: txn.quantity || 0,
      location: txn.location_name || 'Unknown',
      reference_type: txn.reference_type || 'N/A',
      created_at: txn.created_at,
    }))

    return NextResponse.json({ transactions: processedTransactions })
  } catch (error) {
    console.error('[v0] Error in all-transactions API:', error)
    return NextResponse.json({ transactions: [] })
  }
}
