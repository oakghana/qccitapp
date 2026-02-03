import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const {
      item_id,
      assigned_to_name,
      assigned_to_email,
      department,
      room_number,
      requisition_number,
      is_replacement,
      replacement_reason,
      notes,
      quantity,
      location,
      assigned_by,
      assigned_by_role,
      user_location // Add user location for regional IT head validation
    } = await request.json()

    console.log("[assign-stock] Processing stock assignment:", {
      item_id,
      assigned_to_name,
      quantity,
      location,
      assigned_by_role
    })

    // Check authorization - only admin, it_store_head, and regional_it_head can assign stock
    const allowedRoles = ["admin", "it_store_head", "regional_it_head"]
    if (!allowedRoles.includes(assigned_by_role)) {
      return NextResponse.json(
        { error: "Unauthorized. Only Admin, IT Store Head, and Regional IT Head can assign stock items." },
        { status: 403 }
      )
    }

    // Location-based authorization rules
    if (assigned_by_role === "it_store_head") {
      // IT Store Head can only assign from Head Office stock
      if (location !== "head_office") {
        return NextResponse.json(
          { error: "IT Store Head can only assign items from Head Office stock." },
          { status: 403 }
        )
      }
    } else if (assigned_by_role === "regional_it_head") {
      // Regional IT Head can only assign from their location stock, not central stores
      if (location === "central_stores") {
        return NextResponse.json(
          { error: "Regional IT Head cannot assign items from Central Stores. Central store items must be requisitioned." },
          { status: 403 }
        )
      }
      // Check if the user can assign from this location
      if (user_location && location !== user_location) {
        return NextResponse.json(
          { error: `Regional IT Head can only assign items from their own location (${user_location}).` },
          { status: 403 }
        )
      }
    }

    // Central store stock can only be requisitioned, not assigned directly
    if (location === "central_stores" || location === "Central Stores") {
      return NextResponse.json(
        { error: "Direct assignment from Central Stores is not permitted. Please select the appropriate regional or head office stock, or create a requisition request for Central Stores items." },
        { status: 403 }
      )
    }

    // Get current stock item details
    const { data: stockItem, error: stockError } = await supabaseAdmin
      .from("store_items")
      .select("*")
      .eq("id", item_id)
      .eq("location", location)
      .single()

    if (stockError || !stockItem) {
      console.error("[assign-stock] Error fetching stock item:", stockError)
      return NextResponse.json(
        { error: "Stock item not found" },
        { status: 404 }
      )
    }

    // Validate quantity limits to prevent timeout issues
    if (quantity <= 0 || quantity > 50) {
      return NextResponse.json(
        { error: "Quantity must be between 1 and 50 items." },
        { status: 400 }
      )
    }

    // Deduct stock from location
    const newQuantity = stockItem.quantity - quantity
    const { error: updateStockError } = await supabaseAdmin
      .from("store_items")
      .update({
        quantity: newQuantity,
        quantity_in_stock: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item_id)

    if (updateStockError) {
      console.error("[assign-stock] Error updating stock:", updateStockError)
      return NextResponse.json(
        { error: "Failed to update stock quantity" },
        { status: 500 }
      )
    }

    console.log(`[assign-stock] Stock reduced for ${stockItem.name}: ${stockItem.quantity} -> ${newQuantity}`)

    // Create device entries for hardware items
    const deviceCategories = ["Computers", "Printers", "Network Equipment", "Peripherals", "Accessories", "Hardware"]
    const isHardware = deviceCategories.some(cat => 
      stockItem.category?.toLowerCase().includes(cat.toLowerCase()) ||
      stockItem.name.toLowerCase().includes("laptop") ||
      stockItem.name.toLowerCase().includes("desktop") ||
      stockItem.name.toLowerCase().includes("printer") ||
      stockItem.name.toLowerCase().includes("monitor") ||
      stockItem.name.toLowerCase().includes("mouse") ||
      stockItem.name.toLowerCase().includes("keyboard")
    )

    let createdDevices = []

    if (isHardware) {
      // Create device entries for each quantity - use batch insert for better performance
      const deviceInserts = []
      
      for (let i = 0; i < quantity; i++) {
        const serialNumber = `${stockItem.sku || stockItem.name.substring(0, 3).toUpperCase()}-${Date.now()}-${i + 1}`
        
        const deviceNotes = [
          `Assigned to ${assigned_to_name}`,
          `Department: ${department}`,
          `Room: ${room_number || 'N/A'}`,
          requisition_number ? `Requisition: ${requisition_number}` : '',
          is_replacement ? `Replacement${replacement_reason ? ` - ${replacement_reason}` : ''}` : '',
          notes || ''
        ].filter(Boolean).join('. ')

        deviceInserts.push({
          device_type: stockItem.category || "Other",
          brand: stockItem.name.split(" ")[0] || "Generic",
          model: stockItem.name,
          serial_number: serialNumber,
          status: "in_use",
          location: location,
          assigned_to: assigned_to_name,
          office_location: department,
          room_number: room_number,
          notes: deviceNotes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      // Batch insert all devices at once
      const { data: newDevices, error: deviceError } = await supabaseAdmin
        .from("devices")
        .insert(deviceInserts)
        .select()

      if (deviceError) {
        console.error("[assign-stock] Error creating device entries:", deviceError)
        // Don't fail the entire operation for device creation errors
      } else {
        createdDevices = newDevices || []
        console.log(`[assign-stock] Created ${createdDevices.length} device entries`)
      }
    }

    // Create stock assignment record
    const assignmentData = {
      item_id: item_id,
      item_name: stockItem.name,
      quantity: quantity,
      assigned_to: assigned_to_name,
      assigned_to_email: assigned_to_email,
      department: department,
      office_location: department,
      room_number: room_number,
      location: location,
      status: "assigned",
      assigned_by: assigned_by,
      assigned_by_role: assigned_by_role,
      requisition_number: requisition_number,
      is_replacement: is_replacement,
      replacement_reason: replacement_reason,
      is_hardware: isHardware,
      devices_created: createdDevices.length,
      notes: notes,
      created_at: new Date().toISOString(),
    }

    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from("stock_assignments")
      .insert(assignmentData)
      .select()
      .single()

    if (assignmentError) {
      console.error("[assign-stock] Error creating assignment:", assignmentError)
      return NextResponse.json(
        { error: "Failed to create stock assignment record" },
        { status: 500 }
      )
    }

    // Record stock transaction
    const transactionNotes = [
      `Assigned to ${assigned_to_name}`,
      `Department: ${department}`,
      requisition_number ? `Requisition: ${requisition_number}` : '',
      is_replacement ? 'Replacement assignment' : '',
      notes || ''
    ].filter(Boolean).join('. ')

    await supabaseAdmin.from("stock_transactions").insert({
      item_id: item_id,
      item_name: stockItem.name,
      transaction_type: "assignment",
      quantity: quantity,
      unit: stockItem.unit,
      location_name: location,
      recipient: assigned_to_name,
      office_location: department,
      room_number: room_number,
      reference_type: 'assignment',
      reference_id: assignment.id,
      reference_number: requisition_number || `ASSIGN-${assignment.id}`,
      notes: transactionNotes,
      performed_by: assigned_by,
      created_at: new Date().toISOString(),
    })

    console.log("[assign-stock] Stock assignment completed successfully")

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${quantity} ${stockItem.name} to ${assigned_to_name}`,
      assignment: assignment,
      devices_created: createdDevices.length,
      remaining_stock: newQuantity
    })

  } catch (error: any) {
    console.error("[assign-stock] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}