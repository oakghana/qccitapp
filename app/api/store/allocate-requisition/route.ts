import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { requisitionId, approvedBy, allocateToLocation } = await request.json()

    if (!requisitionId || !approvedBy || !allocateToLocation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: requisition, error: reqError } = await supabase
      .from("store_requisitions")
      .select("*")
      .eq("id", requisitionId)
      .single()

    if (reqError || !requisition) {
      return NextResponse.json({ error: "Requisition not found" }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from("store_requisitions")
      .update({
        status: "approved",
        approved_by: approvedBy,
        allocated_to_location: allocateToLocation,
        allocation_date: new Date().toISOString(),
        allocated_by: approvedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requisitionId)

    if (updateError) {
      console.error("[v0] Error updating requisition:", updateError)
      return NextResponse.json({ error: "Failed to approve requisition" }, { status: 500 })
    }

    const items = requisition.items || []

    for (const item of items) {
      // Deduct from Head Office stock (store_items)
      const { data: headOfficeItem, error: itemError } = await supabase
        .from("store_items")
        .select("*")
        .eq("id", item.item_id)
        .eq("location", "Head Office")
        .single()

      if (itemError || !headOfficeItem) {
        console.error("[v0] Item not found:", item.item_id)
        continue
      }

      // Deduct quantity from Head Office
      const newHeadOfficeQty = headOfficeItem.quantity - item.quantity
      await supabase
        .from("store_items")
        .update({
          quantity: newHeadOfficeQty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.item_id)

      const { data: regionalStock, error: regionalError } = await supabase
        .from("store_items")
        .select("*")
        .eq("name", headOfficeItem.name)
        .eq("location", allocateToLocation)
        .maybeSingle()

      if (regionalStock) {
        // Update existing regional stock
        await supabase
          .from("store_items")
          .update({
            quantity: regionalStock.quantity + item.quantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", regionalStock.id)
      } else {
        // Create new regional stock entry
        await supabase.from("store_items").insert({
          name: headOfficeItem.name,
          description: headOfficeItem.description,
          category: headOfficeItem.category,
          sku: `SKU-${Date.now()}-${allocateToLocation}`,
          siv_number: `SIV-${Date.now()}-${allocateToLocation}`,
          quantity: item.quantity,
          unit: headOfficeItem.unit,
          location: allocateToLocation,
          reorder_level: headOfficeItem.reorder_level || 5,
          unit_price: headOfficeItem.unit_price,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      await supabase.from("stock_transfers").insert({
        item_id: item.item_id,
        item_name: item.itemName,
        quantity: item.quantity,
        from_location: "Head Office",
        to_location: allocateToLocation,
        transferred_by_name: approvedBy,
        status: "completed",
        notes: `Allocated via requisition ${requisition.requisition_number}`,
        transfer_date: new Date().toISOString(),
        received_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      message: "Requisition allocated successfully",
      requisitionId,
      allocatedTo: allocateToLocation,
    })
  } catch (error) {
    console.error("[v0] Error allocating requisition:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
