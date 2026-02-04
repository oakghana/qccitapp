import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch stock transfer requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") // pending, approved, rejected, all
    const location = searchParams.get("location")
    const userRole = searchParams.get("userRole")

    console.log("[v0] Fetching stock transfer requests:", { status, location, userRole })

    let query = supabaseAdmin
      .from("stock_transfer_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    // Regional IT heads can only see their own requests
    if (userRole === "regional_it_head" && location) {
      query = query.eq("requesting_location", location)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching stock transfer requests:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ requests: data || [] })
  } catch (error) {
    console.error("[v0] Error in stock transfer requests GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new stock transfer request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      itemId,
      itemName,
      itemCode,
      requestedQuantity,
      requestedBy,
      requestingLocation,
      userRole,
      notes,
    } = body

    console.log("[v0] Creating stock transfer request:", body)

    // Only IT Store Head can request transfers from Central Stores to Head Office
    // Regional IT Heads cannot request transfers (they use requisitions instead)
    if (userRole !== "it_store_head") {
      return NextResponse.json(
        { error: "Only IT Store Head can request stock transfers from Central Stores to Head Office" },
        { status: 403 }
      )
    }

    // IT Store Head can only request to Head Office
    if (requestingLocation !== "Head Office" && requestingLocation !== "head_office") {
      return NextResponse.json(
        { error: "Stock transfers can only be requested for Head Office" },
        { status: 403 }
      )
    }

    // Verify Central Stores has the item with stock
    const { data: centralItem, error: centralError } = await supabaseAdmin
      .from("store_items")
      .select("*")
      .eq("id", itemId)
      .eq("location", "Central Stores")
      .single()

    if (centralError || !centralItem) {
      return NextResponse.json({ error: "Item not found in Central Stores" }, { status: 404 })
    }

    if (centralItem.quantity < requestedQuantity) {
      return NextResponse.json(
        { error: `Central Stores only has ${centralItem.quantity} units available` },
        { status: 400 }
      )
    }

    // Check if local stock is actually zero
    const { data: localItems } = await supabaseAdmin
      .from("store_items")
      .select("quantity")
      .eq("name", centralItem.name)
      .eq("location", requestingLocation)

    const localQty = localItems?.[0]?.quantity || 0
    if (localQty > 0) {
      return NextResponse.json(
        { error: `Your location still has ${localQty} units in stock. Request not allowed.` },
        { status: 400 }
      )
    }

    // Generate request number
    const requestNumber = `STR-${Date.now().toString(36).toUpperCase()}`

    // Create the transfer request
    const { data, error } = await supabaseAdmin
      .from("stock_transfer_requests")
      .insert({
        request_number: requestNumber,
        item_id: itemId,
        item_name: itemName || centralItem.name,
        item_code: itemCode || centralItem.sku,
        central_stock_available: centralItem.quantity,
        requested_quantity: requestedQuantity,
        requested_by: requestedBy,
        requesting_location: requestingLocation,
        status: "pending",
        notes: notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating stock transfer request:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Stock transfer request created:", data)

    return NextResponse.json({ request: data })
  } catch (error) {
    console.error("[v0] Error in stock transfer requests POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Approve or reject a stock transfer request
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      requestId,
      action, // "approve" or "reject"
      approvedQuantity, // Can be different from requested (partial approval)
      approvedBy,
      userRole,
      rejectionReason,
    } = body

    console.log("[v0] Processing stock transfer request:", body)

    // Only admin can approve/reject stock transfer requests
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Only Admin can approve or reject stock transfer requests" },
        { status: 403 }
      )
    }

    // Get the transfer request
    const { data: transferRequest, error: fetchError } = await supabaseAdmin
      .from("stock_transfer_requests")
      .select("*")
      .eq("id", requestId)
      .single()

    if (fetchError || !transferRequest) {
      return NextResponse.json({ error: "Transfer request not found" }, { status: 404 })
    }

    if (transferRequest.status !== "pending") {
      return NextResponse.json(
        { error: `Request has already been ${transferRequest.status}` },
        { status: 400 }
      )
    }

    if (action === "reject") {
      // Reject the request
      const { error: rejectError } = await supabaseAdmin
        .from("stock_transfer_requests")
        .update({
          status: "rejected",
          approved_by: approvedBy,
          rejection_reason: rejectionReason || "Request rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)

      if (rejectError) {
        console.error("[v0] Error rejecting request:", rejectError)
        return NextResponse.json({ error: rejectError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "Request rejected" })
    }

    // Approve the request - perform the actual stock transfer
    const qtyToTransfer = approvedQuantity || transferRequest.requested_quantity

    // Get current Central Stores stock
    const { data: centralItem, error: centralError } = await supabaseAdmin
      .from("store_items")
      .select("*")
      .eq("id", transferRequest.item_id)
      .single()

    if (centralError || !centralItem) {
      return NextResponse.json({ error: "Central Stores item not found" }, { status: 404 })
    }

    if (centralItem.quantity < qtyToTransfer) {
      return NextResponse.json(
        { error: `Central Stores only has ${centralItem.quantity} units. Cannot transfer ${qtyToTransfer}` },
        { status: 400 }
      )
    }

    // 1. Reduce Central Stores stock
    const newCentralQty = centralItem.quantity - qtyToTransfer
    const { error: updateCentralError } = await supabaseAdmin
      .from("store_items")
      .update({
        quantity: newCentralQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transferRequest.item_id)

    if (updateCentralError) {
      console.error("[v0] Error reducing Central Stores stock:", updateCentralError)
      return NextResponse.json({ error: "Failed to update Central Stores stock" }, { status: 500 })
    }

    // 2. Increase destination location stock (or create if doesn't exist)
    const { data: destItem } = await supabaseAdmin
      .from("store_items")
      .select("*")
      .eq("name", centralItem.name)
      .eq("location", transferRequest.requesting_location)
      .maybeSingle()

    if (destItem) {
      // Update existing item
      const { error: updateDestError } = await supabaseAdmin
        .from("store_items")
        .update({
          quantity: destItem.quantity + qtyToTransfer,
          updated_at: new Date().toISOString(),
        })
        .eq("id", destItem.id)

      if (updateDestError) {
        // Rollback Central Stores
        await supabaseAdmin
          .from("store_items")
          .update({ quantity: centralItem.quantity })
          .eq("id", transferRequest.item_id)
        return NextResponse.json({ error: "Failed to update destination stock" }, { status: 500 })
      }
    } else {
      // Create new item at destination with all required fields
      const locationPrefix = transferRequest.requesting_location.substring(0, 3).toUpperCase()
      const newSku = `${locationPrefix}-${centralItem.sku || Date.now()}`
      const newSivNumber = `${locationPrefix}-SIV-${Date.now()}`
      
      const { error: createError } = await supabaseAdmin
        .from("store_items")
        .insert({
          name: centralItem.name,
          category: centralItem.category,
          sku: newSku,
          siv_number: newSivNumber, // Required field
          quantity: qtyToTransfer,
          reorder_level: centralItem.reorder_level || 5,
          unit: centralItem.unit || "pcs",
          location: transferRequest.requesting_location,
          supplier: centralItem.supplier || "Central Stores",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

      if (createError) {
        // Rollback Central Stores
        await supabaseAdmin
          .from("store_items")
          .update({ quantity: centralItem.quantity })
          .eq("id", transferRequest.item_id)
        console.error("[v0] Error creating destination item:", createError)
        return NextResponse.json({ error: `Failed to create destination stock item: ${createError.message}` }, { status: 500 })
      }
    }

    // 3. Update the transfer request status
    const { error: updateRequestError } = await supabaseAdmin
      .from("stock_transfer_requests")
      .update({
        status: "approved",
        approved_quantity: qtyToTransfer,
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (updateRequestError) {
      console.error("[v0] Error updating request status:", updateRequestError)
    }

    // 4. Log the transactions (both transfer_out and transfer_in)
    const txnNumber = `TXN-${transferRequest.request_number}-${Date.now()}`
    
    // Transfer out from Central Stores
    await supabaseAdmin.from("stock_transactions").insert({
      item_id: transferRequest.item_id,
      item_name: centralItem.name,
      transaction_number: `${txnNumber}-OUT`,
      transaction_type: "transfer_out",
      quantity: qtyToTransfer,
      location_name: "Central Stores",
      reference_number: transferRequest.request_number,
      performed_by_name: approvedBy || "Store Manager",
      notes: `Stock transferred to ${transferRequest.requesting_location}`,
      created_at: new Date().toISOString(),
    })
    
    // Transfer in to requesting location
    await supabaseAdmin.from("stock_transactions").insert({
      item_id: transferRequest.item_id,
      item_name: centralItem.name,
      transaction_number: `${txnNumber}-IN`,
      transaction_type: "transfer_in",
      quantity: qtyToTransfer,
      location_name: transferRequest.requesting_location,
      reference_number: transferRequest.request_number,
      performed_by_name: transferRequest.requested_by || "Regional IT Head",
      notes: `Stock received from Central Stores`,
      created_at: new Date().toISOString(),
    })

    console.log("[v0] Stock transfer approved:", {
      from: "Central Stores",
      to: transferRequest.requesting_location,
      quantity: qtyToTransfer,
      item: centralItem.name,
    })

    return NextResponse.json({
      success: true,
      message: `Transferred ${qtyToTransfer} units of ${centralItem.name} to ${transferRequest.requesting_location}`,
    })
  } catch (error) {
    console.error("[v0] Error in stock transfer requests PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
