import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { requisitionId, processedBy } = body

    if (!requisitionId) {
      return NextResponse.json({ error: "Requisition ID is required" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Get the requisition
    const { data: requisition, error: fetchError } = await supabaseAdmin
      .from("store_requisitions")
      .select("*")
      .eq("id", requisitionId)
      .maybeSingle()

    if (fetchError || !requisition) {
      console.error("[v0] Requisition not found:", fetchError)
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
    }

    // Check if this is a head office request (IT Head requesting for Central Stores)
    const isHeadOfficeRequest = requisition.requested_by_role === "it_head" && 
                                 requisition.location === "Central Stores"

    if (!isHeadOfficeRequest) {
      return NextResponse.json(
        { error: "Only head office requests can be auto-approved" },
        { status: 400 },
      )
    }

    // Get the item
    let itemId = requisition.item_id
    if (!itemId && Array.isArray(requisition.items) && requisition.items.length > 0) {
      itemId = requisition.items[0].item_id
    }

    if (!itemId) {
      return NextResponse.json({ error: "No item found in requisition" }, { status: 400 })
    }

    // Get source stock (Central Stores)
    const { data: sourceStock, error: sourceError } = await supabaseAdmin
      .from("store_items")
      .select("*")
      .eq("location", "Central Stores")
      .eq("id", itemId)
      .maybeSingle()

    if (sourceError) {
      console.error("[v0] Error fetching source stock:", sourceError)
      return NextResponse.json({ error: "Failed to fetch stock" }, { status: 500 })
    }

    const quantityToTransfer = requisition.quantity || 1

    // Reduce central store stock
    if (sourceStock && sourceStock.quantity >= quantityToTransfer) {
      const newSourceQuantity = sourceStock.quantity - quantityToTransfer

      const { error: updateError } = await supabaseAdmin
        .from("store_items")
        .update({
          quantity: newSourceQuantity,
          quantity_in_stock: newSourceQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sourceStock.id)

      if (updateError) {
        console.error("[v0] Error updating central store stock:", updateError)
        throw new Error("Failed to update central store stock")
      }

      // Record transaction
      await supabaseAdmin.from("stock_transactions").insert({
        item_id: itemId,
        item_name: sourceStock.name,
        location_id: sourceStock.id,
        location_name: "Central Stores",
        quantity: quantityToTransfer,
        quantity_before: sourceStock.quantity,
        quantity_after: newSourceQuantity,
        transaction_type: "head_office_requisition",
        reference_id: requisitionId,
        reference_type: "requisition",
        performed_by: processedBy || requisition.requested_by,
        performed_by_name: requisition.requested_by_name,
        notes: "Head office auto-approved requisition",
      })
    } else {
      console.warn("[v0] Insufficient stock at central store for auto-approval")
    }

    // Mark requisition as approved
    const { error: updateReqError } = await supabaseAdmin
      .from("store_requisitions")
      .update({
        status: "approved",
        approved_by: processedBy || requisition.requested_by,
        approved_at: new Date().toISOString(),
        notes: "Auto-approved head office requisition",
      })
      .eq("id", requisitionId)

    if (updateReqError) {
      console.error("[v0] Error updating requisition status:", updateReqError)
      throw new Error("Failed to update requisition status")
    }

    console.log("[v0] Head office requisition auto-approved:", requisitionId)

    return NextResponse.json({
      success: true,
      message: "Head office requisition auto-approved and stock adjusted",
      requisitionId,
    })
  } catch (error: any) {
    console.error("[v0] Error in auto-approve requisition route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
