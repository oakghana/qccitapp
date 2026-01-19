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
      approvedQuantity,
      approvalNotes,
      approvedBy,
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
      itemId: requisition.item_id,
    })

    // Get item_id from requisition - could be in items array or item_id field
    let itemId = requisition.item_id
    if (!itemId && Array.isArray(requisition.items) && requisition.items.length > 0) {
      itemId = requisition.items[0].item_id
    }

    if (!itemId) {
      console.error("[v0] No item_id found in requisition")
      return NextResponse.json({ error: "No item_id found in requisition" }, { status: 400 })
    }

    let updateError

    if (approvalAction === "approve") {
      // Get stock for source (central) and destination locations using store_items table
      const { data: sourceStock } = await supabaseAdmin
        .from("store_items")
        .select("*")
        .eq("location", "Central Stores")
        .eq("id", itemId)
        .single()

      const { data: destStock } = await supabaseAdmin
        .from("store_items")
        .select("*")
        .eq("location", requisition.location)
        .eq("id", itemId)
        .single()

      const quantityToTransfer = approvedQuantity || requisition.quantity

      // Update central store stock (decrease)
      if (sourceStock) {
        const newSourceQuantity = Math.max(0, (sourceStock.quantity || 0) - quantityToTransfer)

        const { error: sourceUpdateError } = await supabaseAdmin
          .from("store_items")
          .update({ quantity: newSourceQuantity, quantity_in_stock: newSourceQuantity })
          .eq("id", sourceStock.id)

        if (sourceUpdateError) {
          console.error("[v0] Error updating source stock:", sourceUpdateError)
          throw new Error(`Failed to update central store stock: ${sourceUpdateError.message}`)
        }

        // Record stock transaction
        const { error: transactionError } = await supabaseAdmin
          .from("stock_transactions")
          .insert({
            item_id: itemId,
            item_name: sourceStock.name,
            location_id: sourceStock.id,
            location_name: "Central Stores",
            quantity: quantityToTransfer,
            quantity_before: sourceStock.quantity || 0,
            quantity_after: newSourceQuantity,
            transaction_type: "transfer",
            reference_id: requisitionId,
            reference_type: "requisition",
            performed_by: approvedBy,
            performed_by_name: approvedBy,
            notes: `Requisition approved: ${approvalNotes || ""}`,
          })

        if (transactionError) {
          console.error("[v0] Error creating transaction:", transactionError)
          throw new Error(`Failed to record stock transaction: ${transactionError.message}`)
        }
      } else {
        console.warn("[v0] No source stock found for central store, item:", itemId)
      }

      // Update destination location stock (increase)
      if (destStock) {
        const newDestQuantity = (destStock.quantity || 0) + quantityToTransfer

        const { error: destUpdateError } = await supabaseAdmin
          .from("store_items")
          .update({ quantity: newDestQuantity, quantity_in_stock: newDestQuantity })
          .eq("id", destStock.id)

        if (destUpdateError) {
          console.error("[v0] Error updating destination stock:", destUpdateError)
          throw new Error(`Failed to update destination stock: ${destUpdateError.message}`)
        }

        // Record receipt transaction
        const { error: receiptError } = await supabaseAdmin
          .from("stock_transactions")
          .insert({
            item_id: itemId,
            item_name: destStock.name,
            location_id: destStock.id,
            location_name: requisition.location,
            quantity: quantityToTransfer,
            quantity_before: destStock.quantity || 0,
            quantity_after: newDestQuantity,
            transaction_type: "transfer_receipt",
            reference_id: requisitionId,
            reference_type: "requisition",
            performed_by: approvedBy,
            performed_by_name: approvedBy,
            notes: `Stock received from central store`,
          })

        if (receiptError) {
          console.error("[v0] Error creating receipt transaction:", receiptError)
          throw new Error(`Failed to record receipt transaction: ${receiptError.message}`)
        }
      } else {
        console.warn("[v0] No stock found at destination location, creating new entry if possible")
      }

      console.log("[v0] Stock transfer completed successfully:", {
        requisitionId,
        quantityTransferred: quantityToTransfer,
        from: "Central Stores",
        to: requisition.location,
      })

      // Update requisition status to approved
      const { error: finalUpdateError } = await supabaseAdmin
        .from("store_requisitions")
        .update({
          status: "approved",
          approved_by: approvedBy,
          notes: approvalNotes || "Requisition approved and stock transferred",
        })
        .eq("id", requisitionId)

      if (finalUpdateError) {
        console.error("[v0] Error updating requisition status:", finalUpdateError)
        throw new Error(`Failed to mark requisition as approved: ${finalUpdateError.message}`)
      }

      return NextResponse.json({
        success: true,
        message: "Requisition approved and stock transferred",
        requisitionId,
        quantityTransferred: quantityToTransfer,
      })
    } else if (approvalAction === "reject") {
      // Update requisition status to rejected
      const { error: updateError } = await supabaseAdmin
        .from("store_requisitions")
        .update({
          status: "rejected",
          approved_by: approvedBy,
          notes: approvalNotes || "Requisition rejected",
        })
        .eq("id", requisitionId)

      if (updateError) {
        console.error("[v0] Error rejecting requisition:", updateError)
        return NextResponse.json({ error: "Failed to reject requisition" }, { status: 500 })
      }

      console.log("[v0] Requisition rejected:", requisitionId)

      return NextResponse.json({
        success: true,
        message: "Requisition rejected",
        requisitionId,
      })
    } else {
      return NextResponse.json(
        { error: "Invalid approval action. Must be 'approve' or 'reject'" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("[v0] Error processing requisition approval:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
