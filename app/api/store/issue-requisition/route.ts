import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { requisitionId, recipientName, officeLocation, roomNumber, notes, location, items } = await request.json()

    console.log("[v0] Issuing requisition:", requisitionId, "to:", recipientName)

    // Validate required fields
    if (!requisitionId || !recipientName || !officeLocation) {
      return NextResponse.json(
        { error: "Requisition ID, recipient name, and office location are required" },
        { status: 400 }
      )
    }

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

    const requisitionItems = items || requisition.items || []

    // Process each item
    for (const item of requisitionItems) {
      if (!item.item_id) {
        console.warn("[v0] Skipping item without item_id:", item.itemName)
        continue
      }

      // Get current stock level
      const { data: currentItem, error: fetchError } = await supabaseAdmin
        .from("store_items")
        .select("*")
        .eq("id", item.item_id)
        .eq("location", location)
        .single()

      if (fetchError || !currentItem) {
        console.error("[v0] Error fetching item:", item.itemName, fetchError)
        return NextResponse.json(
          { error: `Item ${item.itemName} not found in stock at ${location}` },
          { status: 404 }
        )
      }

      const newQuantity = currentItem.quantity - item.quantity

      if (newQuantity < 0) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${item.itemName}. Available: ${currentItem.quantity}, Required: ${item.quantity}`,
          },
          { status: 400 }
        )
      }

      // Update stock level
      const { error: updateError } = await supabaseAdmin
        .from("store_items")
        .update({
          quantity: newQuantity,
          quantity_in_stock: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.item_id)

      if (updateError) {
        console.error("[v0] Error updating stock:", updateError)
        return NextResponse.json(
          { error: `Failed to update stock for ${item.itemName}` },
          { status: 500 }
        )
      }

      console.log(`[v0] Stock reduced for ${item.itemName}: ${currentItem.quantity} -> ${newQuantity}`)

      // Create device entries for issued items
      // Only create device entries for actual hardware/equipment categories
      const deviceCategories = ["Computers", "Printers", "Network Equipment", "Peripherals", "Accessories"]
      const shouldCreateDevice = deviceCategories.some(cat => 
        currentItem.category?.toLowerCase().includes(cat.toLowerCase())
      )

      if (shouldCreateDevice) {
        // Create device entries for each quantity
        for (let i = 0; i < item.quantity; i++) {
          const serialNumber = `${currentItem.sku || currentItem.name.substring(0, 3).toUpperCase()}-${Date.now()}-${i + 1}`
          
          const { error: deviceError } = await supabaseAdmin.from("devices").insert({
            device_type: currentItem.category || "Other",
            brand: currentItem.name.split(" ")[0] || "Generic",
            model: currentItem.name,
            serial_number: serialNumber,
            status: "in_use",
            location: location,
            assigned_to: recipientName,
            office_location: officeLocation,
            room_number: roomNumber,
            notes: `Issued via requisition ${requisition.requisition_number}. ${notes || ""}`.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (deviceError) {
            console.error("[v0] Error creating device entry:", deviceError)
            // Don't fail the whole operation, just log the error
          } else {
            console.log(`[v0] Created device entry for ${item.itemName} - ${serialNumber}`)
          }
        }
      }

      // Record stock transaction
      await supabaseAdmin.from("stock_transactions").insert({
        item_id: item.item_id,
        item_name: item.itemName,
        transaction_type: "issue",
        quantity: item.quantity,
        unit: item.unit,
        location: location,
        recipient: recipientName,
        office_location: officeLocation,
        room_number: roomNumber,
        notes: notes || `Issued via ${requisition.requisition_number}`,
        performed_by: "Store Manager",
        created_at: new Date().toISOString(),
      })
    }

    // Update requisition status to issued
    const { error: updateReqError } = await supabaseAdmin
      .from("store_requisitions")
      .update({
        status: "issued",
        issued_by: "Store Manager",
        issued_to: recipientName,
        office_location: officeLocation,
        room_number: roomNumber,
        issue_notes: notes,
        issued_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requisitionId)

    if (updateReqError) {
      console.error("[v0] Error updating requisition status:", updateReqError)
      return NextResponse.json(
        { error: "Items issued but failed to update requisition status" },
        { status: 500 }
      )
    }

    console.log("[v0] Requisition issued successfully:", requisitionId)

    return NextResponse.json({
      success: true,
      message: "Items issued successfully. Stock deducted and devices created.",
      requisitionId,
    })
  } catch (error: any) {
    console.error("[v0] Error in issue-requisition route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
