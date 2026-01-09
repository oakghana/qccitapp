import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")
    const itemName = searchParams.get("itemName")

    if (!itemId && !itemName) {
      return NextResponse.json({ error: "Item ID or name is required" }, { status: 400 })
    }

    let query = supabase.from("stock_transfers").select("*").order("transfer_date", { ascending: false })

    if (itemId) {
      query = query.eq("item_id", itemId)
    } else if (itemName) {
      query = query.eq("item_name", itemName)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ transfers: data || [] })
  } catch (error: any) {
    console.error("History fetch error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch item history" }, { status: 500 })
  }
}
