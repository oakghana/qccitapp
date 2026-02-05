import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const {
      transactionId,
      itemId,
      quantity,
      location,
      transactionType,
      deletedBy,
      reason,
      userRole,
    } = await request.json()

    // Verify admin authorization
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete transactions' },
        { status: 403 }
      )
    }

    // Delete the original transaction
    const { error: deleteError } = await supabase
      .from('stock_transactions')
      .delete()
      .eq('id', transactionId)

    if (deleteError) {
      console.error('[v0] Error deleting transaction:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete transaction' },
        { status: 500 }
      )
    }

    // Create reversal transaction with opposite type
    let reversalType = ''
    let reversalQuantity = -quantity

    switch (transactionType.toLowerCase()) {
      case 'addition':
      case 'receipt':
        reversalType = 'reversal_reduction'
        reversalQuantity = -quantity
        break
      case 'reduction':
      case 'issue':
        reversalType = 'reversal_addition'
        reversalQuantity = quantity
        break
      case 'transfer_out':
        reversalType = 'reversal_transfer_in'
        reversalQuantity = quantity
        break
      case 'transfer_in':
        reversalType = 'reversal_transfer_out'
        reversalQuantity = -quantity
        break
      case 'assignment':
        reversalType = 'reversal_unassignment'
        reversalQuantity = -quantity
        break
      default:
        reversalType = 'reversal'
        reversalQuantity = -quantity
    }

    // Insert reversal transaction
    const { error: reversalError } = await supabase
      .from('stock_transactions')
      .insert({
        item_id: itemId,
        transaction_type: reversalType,
        quantity: Math.abs(reversalQuantity),
        location_name: location,
        reference_type: 'reversal',
        reference_number: `REVERSAL-${Date.now()}`,
        notes: `Reversal of ${transactionType} transaction. Reason: ${reason}. Deleted by: ${deletedBy}`,
        created_at: new Date().toISOString(),
      })

    if (reversalError) {
      console.error('[v0] Error creating reversal transaction:', reversalError)
      return NextResponse.json(
        { error: reversalError.message || 'Failed to create reversal transaction' },
        { status: 500 }
      )
    }

    // If the original transaction was an addition, reduce stock
    // If it was a reduction, increase stock back
    if (['addition', 'receipt', 'transfer_in'].includes(transactionType.toLowerCase())) {
      // Reduce stock quantity
      const { data: existingItem, error: fetchError } = await supabase
        .from('store_items')
        .select('quantity')
        .eq('id', itemId)
        .eq('location', location)
        .single()

      if (!fetchError && existingItem) {
        const newQuantity = Math.max(0, existingItem.quantity - quantity)
        await supabase
          .from('store_items')
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq('id', itemId)
          .eq('location', location)
      }
    } else if (['reduction', 'issue', 'transfer_out'].includes(transactionType.toLowerCase())) {
      // Increase stock quantity
      const { data: existingItem, error: fetchError } = await supabase
        .from('store_items')
        .select('quantity')
        .eq('id', itemId)
        .eq('location', location)
        .single()

      if (!fetchError && existingItem) {
        const newQuantity = existingItem.quantity + quantity
        await supabase
          .from('store_items')
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq('id', itemId)
          .eq('location', location)
      }
    }

    console.log('[v0] Transaction deleted and reversal created:', transactionId)

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted and reversal created successfully',
    })
  } catch (error: any) {
    console.error('[v0] Error in delete-transaction route:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
