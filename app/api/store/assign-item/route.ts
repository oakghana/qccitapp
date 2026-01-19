import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { itemId, itemName, quantity, assignedTo, assignedBy, location, notes } = body

    if (!itemId || !quantity || !assignedTo || !assignedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Check if sufficient stock is available
    const { data: item, error: fetchError } = await supabaseAdmin
      .from("store_items")
      .select("*")
      .eq("id", itemId)
      .maybeSingle()

    if (fetchError || !item) {
      console.error("[v0] Error fetching item:", fetchError)
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (item.quantity < quantity) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${item.quantity}, Requested: ${quantity}` },
        { status: 400 },
      )
    }

    // Reduce stock
    const newQuantity = item.quantity - quantity
    const { error: updateError } = await supabaseAdmin
      .from("store_items")
      .update({
        quantity: newQuantity,
        quantity_in_stock: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)

    if (updateError) {
      console.error("[v0] Error updating stock:", updateError)
      return NextResponse.json({ error: "Failed to update stock" }, { status: 500 })
    }

    // Create assignment record
    const { data: assignment, error: assignError } = await supabaseAdmin
      .from("stock_assignments")
      .insert({
        item_id: itemId,
        item_name: itemName || item.name,
        quantity: quantity,
        assigned_to: assignedTo,
        assigned_by: assignedBy,
        location: location || item.location,
        notes: notes || null,
        status: "assigned",
        assigned_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()

    if (assignError) {
      console.error("[v0] Error creating assignment:", assignError)
      return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 })
    }

    console.log("[v0] Assignment created successfully:", assignment)

    return NextResponse.json({
      success: true,
      message: "Item assigned successfully",
      newQuantity,
      assignment,
    })
  } catch (error: any) {
    console.error("[v0] Error in assign-item route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
