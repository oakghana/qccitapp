import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile || (profile.role !== "admin" && profile.role !== "it_store_head")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { data: items, error } = await supabase.from("store_items").select("*").order("item_name")

    if (error) {
      console.error("[v0] Error fetching store items:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ report: [] })
    }

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    const firstDayOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Get requisitions for current month
    const { data: currentMonthRequisitions } = await supabase
      .from("store_requisitions")
      .select("items")
      .gte("allocation_date", firstDayOfMonth.toISOString())
      .eq("status", "completed")

    // Get requisitions for previous month to calculate opening balance
    const { data: previousMonthRequisitions } = await supabase
      .from("store_requisitions")
      .select("items")
      .gte("allocation_date", firstDayOfPreviousMonth.toISOString())
      .lte("allocation_date", lastDayOfPreviousMonth.toISOString())
      .eq("status", "completed")

    // Calculate quantities issued per item
    const itemsIssuedThisMonth: Record<string, number> = {}
    const itemsIssuedPreviousMonth: Record<string, number> = {}

    currentMonthRequisitions?.forEach((req) => {
      if (req.items && Array.isArray(req.items)) {
        req.items.forEach((item: any) => {
          const itemId = item.itemId || item.item_id
          const quantity = item.quantity || 0
          itemsIssuedThisMonth[itemId] = (itemsIssuedThisMonth[itemId] || 0) + quantity
        })
      }
    })

    previousMonthRequisitions?.forEach((req) => {
      if (req.items && Array.isArray(req.items)) {
        req.items.forEach((item: any) => {
          const itemId = item.itemId || item.item_id
          const quantity = item.quantity || 0
          itemsIssuedPreviousMonth[itemId] = (itemsIssuedPreviousMonth[itemId] || 0) + quantity
        })
      }
    })

    const summaryData = items.map((item) => {
      const quantityIssuedThisMonth = itemsIssuedThisMonth[item.id] || 0
      const quantityIssuedPreviousMonth = itemsIssuedPreviousMonth[item.id] || 0

      // Calculate previous month balance (current stock + issued this month + issued previous month)
      const previousMonthBalance = (item.quantity || 0) + quantityIssuedThisMonth

      const quantityRequired = item.quantity < item.reorder_level ? item.reorder_level - item.quantity : 0

      return {
        itemName: item.item_name || item.name || "Unknown",
        category: item.category || "Uncategorized",
        previousMonthBalance,
        quantityIssuedThisMonth,
        currentStock: item.quantity || 0,
        reorderLevel: item.reorder_level || 0,
        quantityRequired,
        unitPrice: item.unit_price || 0,
        totalValue: (item.quantity || 0) * (item.unit_price || 0),
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
