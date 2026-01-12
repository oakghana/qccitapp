import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")
    const itemName = searchParams.get("itemName")

    if (!itemId && !itemName) {
      return NextResponse.json({ error: "Item ID or name is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    let query = supabase.from("stock_audit_log").select("*").order("created_at", { ascending: false })

    if (itemId) {
      query = query.eq("item_id", itemId)
    }

    const { data, error } = await query

    if (error) {
      console.error("History fetch error:", error)
      return NextResponse.json({ transfers: [] })
    }

    // Map audit log data to transfer format for compatibility
    const transfers = (data || []).map((log) => ({
      id: log.id,
      item_id: log.item_id,
      item_name: itemName || "Unknown",
      action: log.action,
      transfer_date: log.created_at,
      updated_by: log.updated_by,
      reason: log.reason,
      changes: log.changes,
    }))

    return NextResponse.json({ transfers })
  } catch (error: any) {
    console.error("History fetch error:", error)
    return NextResponse.json({ transfers: [] })
  }
}
