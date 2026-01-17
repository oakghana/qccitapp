import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()

    // Get all store items - no auth required for summary report
    const { data: items, error } = await supabase.from("store_items").select("*").order("name")

    if (error) {
      console.error("[v0] Error fetching store items:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ report: [] })
    }

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get requisitions for current month
    const { data: currentMonthRequisitions } = await supabase
      .from("store_requisitions")
      .select("items, allocation_date")
      .gte("allocation_date", firstDayOfMonth.toISOString())
      .eq("status", "completed")

    // Calculate quantities issued per item
    const itemsIssuedThisMonth: Record<string, number> = {}

    currentMonthRequisitions?.forEach((req) => {
      if (req.items && Array.isArray(req.items)) {
        req.items.forEach((item: any) => {
          const itemId = item.itemId || item.item_id
          const quantity = item.quantity || 0
          itemsIssuedThisMonth[itemId] = (itemsIssuedThisMonth[itemId] || 0) + quantity
        })
      }
    })

    const summaryData = items.map((item) => {
      const quantityIssuedThisMonth = itemsIssuedThisMonth[item.id] || 0

      // Previous month balance = current stock + what was issued this month
      const previousMonthBalance = (item.quantity || 0) + quantityIssuedThisMonth

      const quantityRequired = item.quantity < item.reorder_level ? item.reorder_level - item.quantity : 0

      return {
        itemName: item.name || "Unknown",
        category: item.category || "Uncategorized",
        previousMonthBalance,
        quantityIssuedThisMonth,
        currentStock: item.quantity || 0,
        reorderLevel: item.reorder_level || 0,
        quantityRequired,
        totalValue: item.quantity || 0, // Just show quantity as value since we don't have unit_price
        location: item.location || "Unknown",
        status: item.quantity === 0 ? "Out of Stock" : item.quantity < item.reorder_level ? "Low Stock" : "In Stock",
      }
    })

    return NextResponse.json({ report: summaryData })
  } catch (error: any) {
    console.error("[v0] Error in summary-report:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
