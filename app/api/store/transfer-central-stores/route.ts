import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { itemId, quantity, transferredBy, userRole, notes } = await request.json()

    if (!itemId || !quantity || !transferredBy || !userRole) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const canTransferFromCentralStores = userRole === "admin" || userRole === "it_store_head"

    if (!canTransferFromCentralStores) {
      return NextResponse.json(
        { error: "Unauthorized: Only Admin and IT Store Head can transfer items from Central Stores" },
        { status: 403 },
      )
    }

    const supabase = await createServerClient()

    // Get the Central Stores item
    const { data: centralItem, error: fetchError } = await supabase
      .from("store_items")
      .select("*")
      .eq("id", itemId)
      .eq("location", "Central Stores")
      .single()

    if (fetchError || !centralItem) {
      return NextResponse.json({ error: "Item not found in Central Stores" }, { status: 404 })
    }

    // Check if enough quantity is available
    if (centralItem.quantity < quantity) {
      return NextResponse.json(
        {
          error: `Insufficient quantity in Central Stores. Available: ${centralItem.quantity}, Requested: ${quantity}`,
        },
        { status: 400 },
      )
    }

    const newCentralQty = centralItem.quantity - quantity
    const { error: updateCentralError } = await supabase
      .from("store_items")
      .update({
        quantity: newCentralQty,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)

    if (updateCentralError) {
      console.error("[v0] Error reducing Central Stores quantity:", updateCentralError)
      return NextResponse.json({ error: "Failed to reduce Central Stores quantity" }, { status: 500 })
    }

    const { data: headOfficeItem, error: headOfficeError } = await supabase
      .from("store_items")
      .select("*")
      .eq("name", centralItem.name)
      .eq("location", "Head Office")
      .maybeSingle()

    if (headOfficeItem) {
      // Update existing Head Office item
      const { error: updateHeadOfficeError } = await supabase
        .from("store_items")
        .update({
          quantity: headOfficeItem.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", headOfficeItem.id)

      if (updateHeadOfficeError) {
        console.error("[v0] Error updating Head Office quantity:", updateHeadOfficeError)
        // Rollback Central Stores reduction
        await supabase.from("store_items").update({ quantity: centralItem.quantity }).eq("id", itemId)

        return NextResponse.json({ error: "Failed to update Head Office quantity" }, { status: 500 })
      }
    } else {
      // Create new Head Office entry
      const { error: createHeadOfficeError } = await supabase.from("store_items").insert({
        name: centralItem.name,
        category: centralItem.category,
        sku: `HO-${centralItem.sku}`,
        siv_number: centralItem.siv_number,
        quantity: quantity,
        reorder_level: centralItem.reorder_level,
        unit: centralItem.unit,
        location: "Head Office",
        supplier: centralItem.supplier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (createHeadOfficeError) {
        console.error("[v0] Error creating Head Office item:", createHeadOfficeError)
        // Rollback Central Stores reduction
        await supabase.from("store_items").update({ quantity: centralItem.quantity }).eq("id", itemId)

        return NextResponse.json({ error: "Failed to create Head Office item" }, { status: 500 })
      }
    }

    await supabase.from("audit_logs").insert({
      user: transferredBy,
      action: "CENTRAL_STORES_TRANSFER",
      resource: `store_items/${itemId}`,
      details: `Transferred ${quantity} ${centralItem.unit} of ${centralItem.name} from Central Stores to Head Office. Notes: ${notes || "None"}`,
      severity: "medium",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    await supabase.from("stock_audit_log").insert({
      item_id: itemId,
      action: "TRANSFER_TO_HEAD_OFFICE",
      updated_by: transferredBy,
      reason: notes || "Transfer from Central Stores to Head Office",
      changes: {
        from_location: "Central Stores",
        to_location: "Head Office",
        quantity_transferred: quantity,
        central_stores_before: centralItem.quantity,
        central_stores_after: newCentralQty,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${quantity} ${centralItem.unit} from Central Stores to Head Office`,
      centralStoresNewQty: newCentralQty,
    })
  } catch (error: any) {
    console.error("[v0] Error in Central Stores transfer:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
