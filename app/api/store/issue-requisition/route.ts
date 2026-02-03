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
    const sourceLocation = location || requisition.location
    const destinationLocation = requisition.destination_location

    console.log("[v0] Processing requisition - Source:", sourceLocation, "Destination:", destinationLocation)

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

      // Handle stock transfer between locations
      if (destinationLocation && destinationLocation !== sourceLocation) {
        console.log(`[v0] Processing stock transfer from ${sourceLocation} to ${destinationLocation}`)
        
        // Update source location (deduct stock)
        const { error: sourceUpdateError } = await supabaseAdmin
          .from("store_items")
          .update({
            quantity: newQuantity,
            quantity_in_stock: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.item_id)

        if (sourceUpdateError) {
          console.error("[v0] Error updating source stock:", sourceUpdateError)
          return NextResponse.json(
            { error: `Failed to update stock at source location for ${item.itemName}` },
            { status: 500 }
          )
        }

        // Check if item exists at destination location
        const { data: destinationItem, error: destFetchError } = await supabaseAdmin
          .from("store_items")
          .select("*")
          .eq("name", currentItem.name)
          .eq("location", destinationLocation)
          .single()

        if (destFetchError && destFetchError.code !== 'PGRST116') {
          console.error("[v0] Error checking destination item:", destFetchError)
          return NextResponse.json(
            { error: `Failed to check destination stock for ${item.itemName}` },
            { status: 500 }
          )
        }

        if (destinationItem) {
          // Update existing item at destination
          const { error: destUpdateError } = await supabaseAdmin
            .from("store_items")
            .update({
              quantity: destinationItem.quantity + item.quantity,
              quantity_in_stock: destinationItem.quantity_in_stock + item.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", destinationItem.id)

          if (destUpdateError) {
            console.error("[v0] Error updating destination stock:", destUpdateError)
            return NextResponse.json(
              { error: `Failed to update destination stock for ${item.itemName}` },
              { status: 500 }
            )
          }
          
          console.log(`[v0] Updated destination stock for ${item.itemName}: ${destinationItem.quantity} -> ${destinationItem.quantity + item.quantity}`)
        } else {
          // Create new item at destination location
          const { error: destCreateError } = await supabaseAdmin
            .from("store_items")
            .insert({
              name: currentItem.name,
              description: currentItem.description,
              category: currentItem.category,
              sku: currentItem.sku,
              quantity: item.quantity,
              quantity_in_stock: item.quantity,
              unit_price: currentItem.unit_price,
              location: destinationLocation,
              supplier: currentItem.supplier,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })

          if (destCreateError) {
            console.error("[v0] Error creating destination item:", destCreateError)
            return NextResponse.json(
              { error: `Failed to create item at destination for ${item.itemName}` },
              { status: 500 }
            )
          }
          
          console.log(`[v0] Created new item at destination for ${item.itemName}: quantity ${item.quantity}`)
        }

        console.log(`[v0] Stock transfer completed for ${item.itemName}: ${sourceLocation} (-${item.quantity}) -> ${destinationLocation} (+${item.quantity})`)
      } else {
        // Standard stock reduction for same location
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
      }

      // Create device entries for issued items
      // Only create device entries for actual hardware/equipment categories
      const deviceCategories = ["Computers", "Printers", "Network Equipment", "Peripherals", "Accessories"]
      const shouldCreateDevice = deviceCategories.some(cat => 
        currentItem.category?.toLowerCase().includes(cat.toLowerCase())
      )

      // Use destination location if transfer, otherwise use source location
      const effectiveLocation = destinationLocation || sourceLocation

      if (shouldCreateDevice) {
        // Create device entries for each quantity
        for (let i = 0; i < item.quantity; i++) {
          const serialNumber = `${currentItem.sku || currentItem.name.substring(0, 3).toUpperCase()}-${Date.now()}-${i + 1}`
          
          const { data: newDevice, error: deviceError } = await supabaseAdmin.from("devices").insert({
            device_type: currentItem.category || "Other",
            brand: currentItem.name.split(" ")[0] || "Generic",
            model: currentItem.name,
            serial_number: serialNumber,
            status: "in_use",
            location: effectiveLocation,
            assigned_to: recipientName,
            office_location: officeLocation,
            room_number: roomNumber,
            notes: `Issued via requisition ${requisition.requisition_number}${destinationLocation ? ` (transferred from ${sourceLocation} to ${destinationLocation})` : ''}. ${notes || ""}`.trim(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).select().single()

          if (deviceError) {
            console.error("[v0] Error creating device entry:", deviceError)
          } else {
            console.log(`[v0] Created device entry for ${item.itemName} - ${serialNumber}`)
            
            // Create stock assignment record
            await supabaseAdmin.from("stock_assignments").insert({
              item_id: item.item_id,
              device_id: newDevice?.id,
              item_name: item.itemName,
              quantity: 1,
              assigned_to: recipientName,
              office_location: officeLocation,
              room_number: roomNumber,
              location: effectiveLocation,
              status: "assigned",
              assigned_by: "Store Manager",
              notes: `Issued via ${requisition.requisition_number}${destinationLocation ? ` (transferred from ${sourceLocation})` : ''}`,
              created_at: new Date().toISOString(),
            })
          }
        }
      } else {
        // For non-device items, just create assignment record
        await supabaseAdmin.from("stock_assignments").insert({
          item_id: item.item_id,
          item_name: item.itemName,
          quantity: item.quantity,
          assigned_to: recipientName,
          office_location: officeLocation,
          room_number: roomNumber,
          location: effectiveLocation,
          status: "assigned",
          assigned_by: "Store Manager",
          notes: `Issued via ${requisition.requisition_number}${destinationLocation ? ` (transferred from ${sourceLocation})` : ''}`,
          created_at: new Date().toISOString(),
        })
      }

      // Record stock transaction using the database function
      const { error: transactionError } = await supabaseAdmin.rpc('record_stock_transaction', {
        p_item_id: item.item_id,
        p_transaction_type: 'issue',
        p_quantity: item.quantity,
        p_location: effectiveLocation,
        p_recipient: recipientName,
        p_office_location: officeLocation,
        p_room_number: roomNumber || null,
        p_reference_type: 'requisition',
        p_reference_id: requisitionId,
        p_reference_number: requisition.requisition_number,
        p_notes: notes || `Issued via ${requisition.requisition_number}${destinationLocation ? ` (transferred from ${sourceLocation})` : ''}`,
        p_performed_by: "Store Manager"
      })

      if (transactionError) {
        console.warn("[v0] Could not record transaction via function, using direct insert:", transactionError)
        // Fallback to direct insert
        await supabaseAdmin.from("stock_transactions").insert({
          item_id: item.item_id,
          item_name: item.itemName,
          transaction_type: "issue",
          quantity: item.quantity,
          unit: item.unit,
          location_name: effectiveLocation,
          recipient: recipientName,
          office_location: officeLocation,
          room_number: roomNumber,
          reference_type: 'requisition',
          reference_id: requisitionId,
          reference_number: requisition.requisition_number,
          notes: notes || `Issued via ${requisition.requisition_number}${destinationLocation ? ` (transferred from ${sourceLocation})` : ''}`,
          performed_by: "Store Manager",
          created_at: new Date().toISOString(),
        })
      }
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
