import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { LOCATIONS } from "@/lib/locations"

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

    // Helper: normalize incoming location to a canonical label from LOCATIONS when possible
    function normalizeToLabel(loc: string | undefined) {
      if (!loc) return loc || ""
      const found = Object.entries(LOCATIONS).find(
        ([key, label]) => key.toLowerCase() === loc.toLowerCase() || label.toLowerCase() === loc.toLowerCase(),
      )
      return found ? found[1] : loc
    }

    // Determine source location for deduction (the requisition's location) and canonical allocate label
    const sourceLocationLabel = normalizeToLabel(requisition.location) || "Head Office"
    const allocateToLabel = normalizeToLabel(allocateToLocation)

    for (const item of items) {
      // Try to find the source stock record by id if present, otherwise by name
      // We avoid strict location equality here and match case-insensitively in JS to be tolerant
      let sourceStock = null
      let sourceErr = null

      if (item.item_id) {
        const { data, error } = await supabase.from("store_items").select("*").eq("id", item.item_id).maybeSingle()
        sourceStock = data
        sourceErr = error
      } else {
        const { data, error } = await supabase.from("store_items").select("*").eq("name", item.itemName)
        sourceErr = error
        if (Array.isArray(data)) {
          // find candidate matching source location (case-insensitive)
          const candidate = data.find((d: any) => (d.location || "").toLowerCase() === (sourceLocationLabel || "").toLowerCase())
          sourceStock = candidate || data[0] || null
        } else {
          sourceStock = data || null
        }
      }

      if (sourceErr) {
        console.error("[v0] Error finding source stock for item:", item, sourceErr)
      }

      if (!sourceStock) {
        console.error("[v0] Source stock not found for item:", item.itemName, "at", sourceLocationLabel)
        // Continue: we still create transfer record but skip quantity adjustments
        await supabase.from("stock_transfers").insert({
          item_id: item.item_id || null,
          item_name: item.itemName,
          quantity: item.quantity,
          from_location: sourceLocationLabel,
          to_location: allocateToLabel,
          transferred_by_name: approvedBy,
          status: "completed",
          notes: `Allocated via requisition ${requisition.requisition_number} (source missing)`,
          transfer_date: new Date().toISOString(),
          received_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        continue
      }

      // Deduct quantity from source stock
      const newSourceQty = (sourceStock.quantity || 0) - item.quantity
      await supabase.from("store_items").update({ quantity: newSourceQty, updated_at: new Date().toISOString() }).eq("id", sourceStock.id)

      // Add to regional/target stock
      const { data: regionalCandidates } = await supabase.from("store_items").select("*").eq("name", sourceStock.name)
      let regionalStock = null
      if (Array.isArray(regionalCandidates)) {
        regionalStock = regionalCandidates.find((r: any) => (r.location || "").toLowerCase() === allocateToLabel.toLowerCase())
      } else {
        regionalStock = regionalCandidates
      }

      if (regionalStock) {
        await supabase.from("store_items").update({ quantity: regionalStock.quantity + item.quantity, updated_at: new Date().toISOString() }).eq("id", regionalStock.id)
      } else {
        await supabase.from("store_items").insert({
          name: sourceStock.name,
          description: sourceStock.description,
          category: sourceStock.category,
          quantity: item.quantity,
          unit: sourceStock.unit,
          location: allocateToLabel,
          reorder_level: sourceStock.reorder_level || 5,
          unit_price: sourceStock.unit_price,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      await supabase.from("stock_transfers").insert({
        item_id: item.item_id || null,
        item_name: item.itemName,
        quantity: item.quantity,
        from_location: sourceStock.location || sourceLocationLabel,
        to_location: allocateToLabel,
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
