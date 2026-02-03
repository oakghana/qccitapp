import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")
    const itemName = searchParams.get("itemName")

    if (!itemId && !itemName) {
      return NextResponse.json({ error: "Item ID or name is required" }, { status: 400 })
    }

    console.log("[v0] Fetching item history for:", itemId || itemName)

    // Get audit log data (transfers)
    let auditQuery = supabaseAdmin.from("stock_audit_log").select("*").order("created_at", { ascending: false })

    if (itemId) {
      auditQuery = auditQuery.eq("item_id", itemId)
    }

    const { data: auditData, error: auditError } = await auditQuery

    if (auditError) {
      console.error("Audit history fetch error:", auditError)
    }

    // Get assignment history from stock_assignments table
    let assignmentQuery = supabaseAdmin
      .from("stock_assignments")
      .select("*")
      .order("created_at", { ascending: false })

    if (itemId) {
      assignmentQuery = assignmentQuery.eq("item_id", itemId)
    } else if (itemName) {
      assignmentQuery = assignmentQuery.eq("item_name", itemName)
    }

    const { data: assignments, error: assignmentError } = await assignmentQuery

    if (assignmentError) {
      console.error("Assignment history fetch error:", assignmentError)
    }

    // Get transaction history from stock_transactions table
    let transactionQuery = supabaseAdmin
      .from("stock_transactions")
      .select("*")
      .order("created_at", { ascending: false })

    if (itemId) {
      transactionQuery = transactionQuery.eq("item_id", itemId)
    } else if (itemName) {
      transactionQuery = transactionQuery.eq("item_name", itemName)
    }

    const { data: transactions, error: transactionError } = await transactionQuery

    if (transactionError) {
      console.error("Transaction history fetch error:", transactionError)
    }

    // Map audit log data to transfer format for compatibility
    const transfers = (auditData || []).map((log) => ({
      id: log.id,
      item_id: log.item_id,
      item_name: itemName || "Unknown",
      action: log.action,
      transfer_date: log.created_at,
      updated_by: log.updated_by,
      reason: log.reason,
      changes: log.changes,
      from_location: log.changes?.from_location || "Unknown",
      to_location: log.changes?.to_location || "Unknown",
      quantity: log.changes?.quantity || 0,
      status: "completed",
      notes: log.reason || "",
      transferred_by_name: log.updated_by || "System",
    }))

    // Format assignments for display
    const assignmentHistory = (assignments || []).map((assignment) => ({
      id: assignment.id,
      type: "assignment",
      item_name: assignment.item_name,
      quantity: assignment.quantity,
      assigned_to: assignment.assigned_to,
      office_location: assignment.office_location,
      room_number: assignment.room_number,
      location: assignment.location,
      status: assignment.status,
      assigned_by: assignment.assigned_by,
      notes: assignment.notes,
      created_at: assignment.created_at,
      formatted_date: new Date(assignment.created_at).toLocaleString(),
    }))

    // Format transactions for display
    const transactionHistory = (transactions || []).map((transaction) => ({
      id: transaction.id,
      type: "transaction",
      transaction_type: transaction.transaction_type,
      item_name: transaction.item_name,
      quantity: transaction.quantity,
      location_name: transaction.location_name,
      recipient: transaction.recipient,
      office_location: transaction.office_location,
      room_number: transaction.room_number,
      reference_type: transaction.reference_type,
      reference_number: transaction.reference_number,
      notes: transaction.notes,
      performed_by: transaction.performed_by,
      created_at: transaction.created_at,
      formatted_date: new Date(transaction.created_at).toLocaleString(),
    }))

    return NextResponse.json({
      transfers,
      assignments: assignmentHistory,
      transactions: transactionHistory,
      summary: {
        total_transfers: transfers.length,
        total_assignments: assignmentHistory.length,
        total_transactions: transactionHistory.length,
      }
    })
  } catch (error: any) {
    console.error("History fetch error:", error)
    return NextResponse.json({ 
      transfers: [],
      assignments: [],
      transactions: [],
    })
  }
}
