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

    if (approvalAction === "approve") {
      // Update requisition status to approved
      const { error: updateError } = await supabaseAdmin
        .from("store_requisitions")
        .update({
          status: "approved",
          approved_quantity: approvedQuantity || requisition.quantity,
          approved_date: new Date().toISOString(),
          approved_by: approvedBy,
          approval_notes: approvalNotes,
        })
        .eq("id", requisitionId)

      if (updateError) {
        console.error("[v0] Error updating requisition:", updateError)
        return NextResponse.json({ error: "Failed to approve requisition" }, { status: 500 })
      }

      // Get stock levels for source and destination
      const { data: sourceStock } = await supabaseAdmin
        .from("stock_levels")
        .select("*")
        .eq("location_code", "central")
        .eq("item_id", itemId)
        .single()

      const { data: destStock } = await supabaseAdmin
        .from("stock_levels")
        .select("*")
        .eq("location_code", requisition.location_code)
        .eq("item_id", itemId)
        .single()

      const quantityToTransfer = approvedQuantity || requisition.quantity

      // Update central store stock (decrease)
      if (sourceStock) {
        const newSourceQuantity = Math.max(0, (sourceStock.quantity || 0) - quantityToTransfer)

        const { error: updateError } = await supabaseAdmin
          .from("stock_levels")
          .update({ quantity: newSourceQuantity })
          .eq("id", sourceStock.id)

        if (updateError) {
          console.error("[v0] Error updating source stock:", updateError)
          throw new Error(`Failed to update central store stock: ${updateError.message}`)
        }

        // Record stock transaction for central store
        const { error: transactionError } = await supabaseAdmin
          .from("stock_transactions")
          .insert({
            item_id: itemId,
            from_location: "central",
            to_location: requisition.location_code,
            quantity: quantityToTransfer,
            transaction_type: "transfer",
            reference_id: requisitionId,
            reference_type: "requisition",
            created_by: approvedBy,
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

        const { error: updateError } = await supabaseAdmin
          .from("stock_levels")
          .update({ quantity: newDestQuantity })
          .eq("id", destStock.id)

        if (updateError) {
          console.error("[v0] Error updating destination stock:", updateError)
          throw new Error(`Failed to update destination stock: ${updateError.message}`)
        }
      } else {
        // Create new stock level if it doesn't exist
        const { error: insertError } = await supabaseAdmin
          .from("stock_levels")
          .insert({
            item_id: itemId,
            location_code: requisition.location_code,
            quantity: quantityToTransfer,
          })

        if (insertError) {
          console.error("[v0] Error creating destination stock:", insertError)
          throw new Error(`Failed to create destination stock: ${insertError.message}`)
        }
      }

      // Record stock transaction for destination
      const { error: destTransactionError } = await supabaseAdmin
        .from("stock_transactions")
        .insert({
          item_id: itemId,
          from_location: "central",
          to_location: requisition.location_code,
          quantity: quantityToTransfer,
          transaction_type: "transfer_receipt",
          reference_id: requisitionId,
          reference_type: "requisition",
          created_by: approvedBy,
          notes: `Stock received from central store`,
        })

      if (destTransactionError) {
        console.error("[v0] Error creating destination transaction:", destTransactionError)
        throw new Error(`Failed to record receipt transaction: ${destTransactionError.message}`)
      }

      console.log("[v0] Stock transfer completed successfully:", {
        requisitionId,
        quantityTransferred: quantityToTransfer,
        from: "central",
        to: requisition.location_code,
      })

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
          approved_date: new Date().toISOString(),
          approved_by: approvedBy,
          approval_notes: approvalNotes,
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
