import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { recordTransaction } from "@/lib/transaction-utils"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Normalise a location string to a lowercase underscore key for comparison.
 * Handles both "Head Office" and "head_office" style values from the DB/client.
 */
function normaliseLocation(loc: string | null | undefined): string {
  if (!loc) return ""
  return loc.toLowerCase().replace(/[\s_-]+/g, "_").trim()
}

function isCentralStores(loc: string | null | undefined): boolean {
  const n = normaliseLocation(loc)
  return n === "central_stores" || n === "central stores"
}

function isHeadOffice(loc: string | null | undefined): boolean {
  const n = normaliseLocation(loc)
  return n === "head_office" || n === "head_office_accra" || n === "headoffice"
}

export async function POST(request: NextRequest) {
  try {
    const {
      item_id,
      assigned_to_name,
      assigned_to_email,
      department,
      room_number,
      requisition_number,
      asset_tag,
      serial_number,
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

    // Central store stock can only be requisitioned, not assigned directly
    // Check this BEFORE role-specific checks so it applies to everyone
    if (isCentralStores(location)) {
      return NextResponse.json(
        { error: "Direct assignment from Central Stores is not permitted. Please select the appropriate regional or head office stock, or create a requisition request for Central Stores items." },
        { status: 403 }
      )
    }

    // Location-based authorization rules
    if (assigned_by_role === "it_store_head") {
      // IT Store Head can only assign from Head Office stock
      // Use normalised comparison to handle "Head Office" vs "head_office" mismatches
      if (!isHeadOffice(location)) {
        return NextResponse.json(
          { error: "IT Store Head can only assign items from Head Office stock." },
          { status: 403 }
        )
      }
    } else if (assigned_by_role === "regional_it_head") {
      // Regional IT Head can only assign from their location stock, not central stores
      if (isCentralStores(location)) {
        return NextResponse.json(
          { error: "Regional IT Head cannot assign items from Central Stores. Central store items must be requisitioned." },
          { status: 403 }
        )
      }
      // Check if the user can assign from this location using normalised comparison
      if (user_location && normaliseLocation(location) !== normaliseLocation(user_location)) {
        return NextResponse.json(
          { error: `Regional IT Head can only assign items from their own location (${user_location}).` },
          { status: 403 }
        )
      }
    }

    // Get current stock item details
    // Use ilike for case-insensitive location matching so "Head Office" and "head_office"
    // both resolve to the same item regardless of how the client sends the location value.
    const locationFuzzy = location.replace(/[_-]+/g, " ").trim()
    const { data: stockItem, error: stockError } = await supabaseAdmin
      .from("store_items")
      .select("*")
      .eq("id", item_id)
      .ilike("location", locationFuzzy)
      .maybeSingle()

    if (stockError || !stockItem) {
      console.error("[assign-stock] Error fetching stock item:", stockError, "location:", locationFuzzy)
      return NextResponse.json(
        { error: "Stock item not found. Ensure the item exists in the correct location." },
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
    const cleanedAssetTag = asset_tag?.trim() || ""
    const cleanedSerialNumber = serial_number?.trim() || ""
    const trackingNotes = [
      cleanedAssetTag ? `Asset Tag: ${cleanedAssetTag}` : "",
      cleanedSerialNumber ? `Serial Number: ${cleanedSerialNumber}` : "",
      notes || "",
    ].filter(Boolean).join('. ')

    if (isHardware) {
      // Create device entries for each quantity - use batch insert for better performance
      const deviceInserts = []
      
      for (let i = 0; i < quantity; i++) {
        const generatedSerial = `${stockItem.sku || stockItem.name.substring(0, 3).toUpperCase()}-${Date.now()}-${i + 1}`
        const deviceSerialNumber = cleanedSerialNumber
          ? (quantity > 1 ? `${cleanedSerialNumber}-${i + 1}` : cleanedSerialNumber)
          : generatedSerial
        const deviceAssetTag = cleanedAssetTag
          ? (quantity > 1 ? `${cleanedAssetTag}-${i + 1}` : cleanedAssetTag)
          : null

        const deviceNotes = [
          `Assigned to ${assigned_to_name}`,
          `Department: ${department}`,
          `Room: ${room_number || 'N/A'}`,
          requisition_number ? `Requisition: ${requisition_number}` : '',
          deviceAssetTag ? `Asset Tag: ${deviceAssetTag}` : '',
          deviceSerialNumber ? `Serial Number: ${deviceSerialNumber}` : '',
          is_replacement ? `Replacement${replacement_reason ? ` - ${replacement_reason}` : ''}` : '',
          notes || ''
        ].filter(Boolean).join('. ')

        deviceInserts.push({
          device_type: stockItem.category || "Other",
          brand: stockItem.name.split(" ")[0] || "Generic",
          model: stockItem.name,
          serial_number: deviceSerialNumber,
          asset_tag: deviceAssetTag,
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
      asset_tag: cleanedAssetTag || null,
      serial_number: cleanedSerialNumber || null,
      is_replacement: is_replacement,
      replacement_reason: replacement_reason,
      is_hardware: isHardware,
      devices_created: createdDevices.length,
      notes: trackingNotes,
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
      cleanedAssetTag ? `Asset Tag: ${cleanedAssetTag}` : '',
      cleanedSerialNumber ? `Serial Number: ${cleanedSerialNumber}` : '',
      is_replacement ? 'Replacement assignment' : '',
      notes || ''
    ].filter(Boolean).join('. ')

    await recordTransaction(supabaseAdmin, {
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
