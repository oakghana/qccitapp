import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itemId, deletedBy, reason, userRole, userLocation } = body

    if (!itemId || !deletedBy || !reason || !userRole) {
      return NextResponse.json({ error: "Item ID, deleted by, reason, and user role are required" }, { status: 400 })
    }

    // Only admin can force delete
    if (userRole !== "admin") {
      console.error("[v0] Unauthorized force deletion attempt by:", deletedBy, userRole)
      return NextResponse.json(
        { error: "Unauthorized: Only Admin can force delete stock items and their related actions" },
        { status: 403 }
      )
    }

    const supabase = await createServerClient()

    // Get item details before deletion
    const { data: item, error: fetchError } = await supabase
      .from("store_items")
      .select("*")
      .eq("id", itemId)
      .single()

    if (fetchError || !item) {
      console.error("[v0] Item not found:", fetchError)
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    console.log("[v0] Admin force delete initiated for item:", itemId, "by:", deletedBy)

    // Step 1: Get all related stock transfer requests to delete
    const { data: transferRequests } = await supabase
      .from("stock_transfer_requests")
      .select("id")
      .eq("item_id", itemId)

    const transferRequestIds = transferRequests?.map((r) => r.id) || []
    console.log(`[v0] Found ${transferRequestIds.length} related stock transfer requests to delete`)

    // Step 2: Get all related stock transactions to delete
    const { data: transactions } = await supabase.from("stock_transactions").select("id").eq("item_id", itemId)

    const transactionIds = transactions?.map((t) => t.id) || []
    console.log(`[v0] Found ${transactionIds.length} related stock transactions to delete`)

    // Step 3: Get all related stock assignments to delete
    const { data: assignments } = await supabase.from("stock_assignments").select("id").eq("item_id", itemId)

    const assignmentIds = assignments?.map((a) => a.id) || []
    console.log(`[v0] Found ${assignmentIds.length} related stock assignments to delete`)

    // Step 4: Get all related audit logs to delete
    const { data: auditLogs } = await supabase.from("stock_audit_log").select("id").eq("item_id", itemId)

    const auditLogIds = auditLogs?.map((al) => al.id) || []
    console.log(`[v0] Found ${auditLogIds.length} related stock audit logs to delete`)

    // Now delete in reverse dependency order
    let deletionSummary = {
      transferRequests: 0,
      transactions: 0,
      assignments: 0,
      auditLogs: 0,
      item: 0,
    }

    // Delete transfer requests
    if (transferRequestIds.length > 0) {
      const { error: deleteTransferError } = await supabase
        .from("stock_transfer_requests")
        .delete()
        .in("id", transferRequestIds)

      if (deleteTransferError) {
        console.error("[v0] Error deleting transfer requests:", deleteTransferError)
        return NextResponse.json({ error: "Failed to delete related transfer requests" }, { status: 500 })
      }
      deletionSummary.transferRequests = transferRequestIds.length
    }

    // Delete transactions
    if (transactionIds.length > 0) {
      const { error: deleteTransactionError } = await supabase
        .from("stock_transactions")
        .delete()
        .in("id", transactionIds)

      if (deleteTransactionError) {
        console.error("[v0] Error deleting transactions:", deleteTransactionError)
        return NextResponse.json({ error: "Failed to delete related transactions" }, { status: 500 })
      }
      deletionSummary.transactions = transactionIds.length
    }

    // Delete assignments
    if (assignmentIds.length > 0) {
      const { error: deleteAssignmentError } = await supabase
        .from("stock_assignments")
        .delete()
        .in("id", assignmentIds)

      if (deleteAssignmentError) {
        console.error("[v0] Error deleting assignments:", deleteAssignmentError)
        return NextResponse.json({ error: "Failed to delete related assignments" }, { status: 500 })
      }
      deletionSummary.assignments = assignmentIds.length
    }

    // Delete audit logs
    if (auditLogIds.length > 0) {
      const { error: deleteAuditError } = await supabase.from("stock_audit_log").delete().in("id", auditLogIds)

      if (deleteAuditError) {
        console.error("[v0] Error deleting audit logs:", deleteAuditError)
        return NextResponse.json({ error: "Failed to delete related audit logs" }, { status: 500 })
      }
      deletionSummary.auditLogs = auditLogIds.length
    }

    // Finally delete the stock item itself
    const { error: deleteItemError } = await supabase.from("store_items").delete().eq("id", itemId)

    if (deleteItemError) {
      console.error("[v0] Error deleting stock item:", deleteItemError)
      return NextResponse.json({ error: "Failed to delete stock item" }, { status: 500 })
    }
    deletionSummary.item = 1

    // Log this high-severity action to audit_logs
    await supabase.from("audit_logs").insert({
      user: deletedBy,
      action: "ADMIN_FORCE_DELETE_STOCK",
      resource: `store_items/${itemId}`,
      details: `Force deleted stock item: ${item.name} and all related records (${transferRequestIds.length} transfer requests, ${transactionIds.length} transactions, ${assignmentIds.length} assignments). Reason: ${reason}`,
      severity: "critical",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    console.log("[v0] Admin force delete completed successfully:", deletionSummary)

    return NextResponse.json({
      success: true,
      message: "Item and all related actions deleted successfully",
      deletionSummary,
    })
  } catch (error: any) {
    console.error("[v0] Error in force-delete-item route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
