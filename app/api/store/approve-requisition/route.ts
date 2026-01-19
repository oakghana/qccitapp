import { createClient } from "@supabase/supabase-js"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    const {
      requisitionId,
      approvalAction, // "approve" or "reject"
      approvedQuantities, // Now a map of item_id -> quantity
      approvalNotes,
      approvedBy, // User ID (UUID)
      approvedByName, // Display name
      approvedByRole,
    } = await request.json()

    console.log("[v0] Processing stock requisition:", requisitionId, "Action:", approvalAction)

    // Get requisition details
    const { data: requisition, error: reqError } = await supabaseAdmin
      .from("store_requisitions")
      .select("*")
      .eq("id", requisitionId)
      .single()

    if (reqError || !requisition) {
      console.error("[v0] Requisition not found:", reqError)
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
    }

    console.log("[v0] Requisition details:", {
      id: requisition.id,
      itemsArray: requisition.items,
      requestedBy: requisition.requested_by,
      requestedByRole: requisition.requested_by_role,
      location: requisition.location,
    })

    // ROLE-BASED WORKFLOW LOGIC
    // NO APPROVAL NEEDED for: IT Head, IT Store Head, Admin
    // APPROVAL REQUIRED for: Regional IT Head, IT Staff
    const noApprovalRoles = ["admin", "it_head", "it_store_head"]
    const requiresApprovalRoles = ["regional_it_head", "it_staff"]

    const requestedByRole = requisition.requested_by_role || "it_staff"
    const requiresApproval = requiresApprovalRoles.includes(requestedByRole)
    const isAutoApprovalRole = noApprovalRoles.includes(requestedByRole)

    console.log(`[v0] Role-based workflow check:`, {
      requestedByRole,
      requiresApproval,
      isAutoApprovalRole,
      approvalAction,
    })

    // If requester is IT Head, IT Store Head, or Admin - auto-approve without waiting
    if (isAutoApprovalRole && approvalAction !== "approve") {
      console.log("[v0] Auto-approving requisition from privileged role:", requestedByRole)
      // Continue to automatic approval below
    } else if (requiresApproval && (!approvalAction || approvalAction === "reject")) {
      // Regional IT or IT Staff can be rejected without explicit approval check
      if (approvalAction !== "reject") {
        return NextResponse.json(
          { error: "Regional IT and IT Staff requisitions require explicit approval or rejection from Admin/IT Head" },
          { status: 400 },
        )
      }
    }

    if (approvalAction === "reject") {
      // Handle rejection
      const { error: updateError } = await supabaseAdmin
        .from("store_requisitions")
        .update({
          status: "rejected",
          notes: approvalNotes || "Requisition rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requisitionId)

      if (updateError) {
        console.error("[v0] Error updating requisition status:", updateError)
        return NextResponse.json({ error: "Failed to reject requisition" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Requisition rejected successfully",
      })
    }

    if (approvalAction !== "approve") {
      return NextResponse.json({ error: "Invalid approval action" }, { status: 400 })
    }

    // Process approval for all items in the requisition
    const items = Array.isArray(requisition.items) ? requisition.items : []

    if (items.length === 0) {
      return NextResponse.json({ error: "No items in requisition to approve" }, { status: 400 })
    }

    // Process each item
    let processedCount = 0
    let errorCount = 0

    for (const item of items) {
      try {
        const itemId = item.item_id
        const requestedQty = item.quantity
        const approvedQty = approvedQuantities[itemId] || requestedQty

        console.log(`[v0] Processing item: ${item.itemName} (${itemId}), Approved: ${approvedQty}/${requestedQty}`)

        // Get source stock from Central Stores
        const { data: sourceStock, error: sourceError } = await supabaseAdmin
          .from("store_items")
          .select("*")
          .eq("location", "Central Stores")
          .eq("id", itemId)
          .maybeSingle()

        if (sourceError) {
          console.error(`[v0] Error fetching source stock for ${itemId}:`, sourceError)
          errorCount++
          continue
        }

        // Get destination stock at requesting location
        const { data: destStock, error: destError } = await supabaseAdmin
          .from("store_items")
          .select("*")
          .eq("location", requisition.location)
          .eq("id", itemId)
          .maybeSingle()

        if (destError) {
          console.error(`[v0] Error fetching destination stock for ${itemId}:`, destError)
          errorCount++
          continue
        }

        // Update central store stock (decrease)
        if (sourceStock && approvedQty > 0) {
          const newSourceQuantity = Math.max(0, (sourceStock.quantity || 0) - approvedQty)

          const { error: sourceUpdateError } = await supabaseAdmin
            .from("store_items")
            .update({ quantity: newSourceQuantity, quantity_in_stock: newSourceQuantity, updated_at: new Date().toISOString() })
            .eq("id", sourceStock.id)

          if (sourceUpdateError) {
            console.error(`[v0] Error updating source stock for ${itemId}:`, sourceUpdateError)
            errorCount++
            continue
          }

          // Record transfer_out transaction
          const { error: transactionError } = await supabaseAdmin
            .from("stock_transactions")
            .insert({
              item_id: itemId,
              item_name: sourceStock.name || item.itemName,
              location_id: sourceStock.id,
              location_name: "Central Stores",
              quantity: approvedQty,
              quantity_before: sourceStock.quantity || 0,
              quantity_after: newSourceQuantity,
              transaction_type: "transfer_out",
              reference_id: requisitionId,
              reference_type: "requisition",
              performed_by: approvedBy,
              performed_by_name: approvedByName || approvedBy,
              notes: `Requisition approved: ${approvalNotes || ""}`,
              created_at: new Date().toISOString(),
            })

          if (transactionError) {
            console.error(`[v0] Error creating transfer_out transaction for ${itemId}:`, transactionError)
            errorCount++
            continue
          }
        }

        // Update destination location stock (increase)
        if (destStock && approvedQty > 0) {
          const newDestQuantity = (destStock.quantity || 0) + approvedQty

          const { error: destUpdateError } = await supabaseAdmin
            .from("store_items")
            .update({ quantity: newDestQuantity, quantity_in_stock: newDestQuantity, updated_at: new Date().toISOString() })
            .eq("id", destStock.id)

          if (destUpdateError) {
            console.error(`[v0] Error updating destination stock for ${itemId}:`, destUpdateError)
            errorCount++
            continue
          }

          // Record transfer_in transaction
          const { error: receiptError } = await supabaseAdmin
            .from("stock_transactions")
            .insert({
              item_id: itemId,
              item_name: destStock.name || item.itemName,
              location_id: destStock.id,
              location_name: requisition.location,
              quantity: approvedQty,
              quantity_before: destStock.quantity || 0,
              quantity_after: newDestQuantity,
              transaction_type: "transfer_in",
              reference_id: requisitionId,
              reference_type: "requisition",
              performed_by: approvedBy,
              performed_by_name: approvedByName || approvedBy,
              notes: `Stock received from Central Stores`,
              created_at: new Date().toISOString(),
            })

          if (receiptError) {
            console.error(`[v0] Error creating transfer_in transaction for ${itemId}:`, receiptError)
            errorCount++
            continue
          }
        }

        processedCount++
      } catch (itemError: any) {
        console.error(`[v0] Error processing item:`, itemError)
        errorCount++
      }
    }

    // Update requisition status
    const { error: finalUpdateError } = await supabaseAdmin
      .from("store_requisitions")
      .update({
        status: "approved",
        approved_by: approvedByName || approvedBy,
        notes: approvalNotes || "Requisition approved and stock transferred",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requisitionId)

    if (finalUpdateError) {
      console.error("[v0] Error updating requisition status:", finalUpdateError)
      return NextResponse.json({ error: "Failed to update requisition status" }, { status: 500 })
    }

    console.log(`[v0] Requisition approval completed: ${processedCount} items processed, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `Requisition approved successfully. ${processedCount} items transferred, ${errorCount} items failed.`,
      processedCount,
      errorCount,
    })
  } catch (error: any) {
    console.error("[v0] Error in approve-requisition route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
