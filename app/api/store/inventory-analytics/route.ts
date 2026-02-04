import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface LocationStats {
  name: string
  totalItems: number
  totalQuantity: number
  lowStock: number
  outOfStock: number
}

interface DepartmentStats {
  department: string
  itemsIssued: number
  totalQuantity: number
}

interface CategoryStats {
  category: string
  count: number
  quantity: number
}

interface TransactionSummary {
  location: string
  transactionType: string
  totalQuantity: number
  count: number
  period: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month" // week, month, quarter, year

    console.log("[v0] Fetching inventory analytics for period:", period)

    // Get date range based on period
    const now = new Date()
    let startDate: Date

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // 1. Get store items grouped by location
    const { data: storeItems, error: itemsError } = await supabaseAdmin
      .from("store_items")
      .select("*")

    if (itemsError) {
      console.error("[v0] Error fetching store items:", itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // 2. Calculate location statistics
    const locationStatsMap: Record<string, LocationStats> = {}
    
    storeItems?.forEach(item => {
      const loc = item.location || "Unknown"
      if (!locationStatsMap[loc]) {
        locationStatsMap[loc] = {
          name: loc,
          totalItems: 0,
          totalQuantity: 0,
          lowStock: 0,
          outOfStock: 0
        }
      }
      locationStatsMap[loc].totalItems++
      locationStatsMap[loc].totalQuantity += item.quantity || 0
      if (item.quantity === 0) {
        locationStatsMap[loc].outOfStock++
      } else if (item.quantity <= (item.reorder_level || 5)) {
        locationStatsMap[loc].lowStock++
      }
    })

    const locationStats = Object.values(locationStatsMap)

    // 3. Get stock transactions for the period
    const { data: transactions, error: transError } = await supabaseAdmin
      .from("stock_transactions")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })

    if (transError) {
      console.error("[v0] Error fetching transactions:", transError)
    }

    // 4. Calculate department/recipient statistics (who is getting the most stock)
    const departmentStatsMap: Record<string, DepartmentStats> = {}
    
    transactions?.forEach(trans => {
      if (trans.transaction_type === "issue" || trans.transaction_type === "assignment") {
        const dept = trans.recipient || trans.office_location || "Unknown"
        if (!departmentStatsMap[dept]) {
          departmentStatsMap[dept] = {
            department: dept,
            itemsIssued: 0,
            totalQuantity: 0
          }
        }
        departmentStatsMap[dept].itemsIssued++
        departmentStatsMap[dept].totalQuantity += trans.quantity || 0
      }
    })

    const departmentStats = Object.values(departmentStatsMap)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10)

    // 5. Calculate category distribution
    const categoryStatsMap: Record<string, CategoryStats> = {}
    
    storeItems?.forEach(item => {
      const cat = item.category || "Uncategorized"
      if (!categoryStatsMap[cat]) {
        categoryStatsMap[cat] = {
          category: cat,
          count: 0,
          quantity: 0
        }
      }
      categoryStatsMap[cat].count++
      categoryStatsMap[cat].quantity += item.quantity || 0
    })

    const categoryStats = Object.values(categoryStatsMap)
      .sort((a, b) => b.quantity - a.quantity)

    // 6. Get transaction summary by location and type
    const transactionSummaryMap: Record<string, TransactionSummary> = {}
    
    transactions?.forEach(trans => {
      const loc = trans.location_name || trans.to_location || trans.from_location || "Unknown"
      const key = `${loc}-${trans.transaction_type}`
      if (!transactionSummaryMap[key]) {
        transactionSummaryMap[key] = {
          location: loc,
          transactionType: trans.transaction_type,
          totalQuantity: 0,
          count: 0,
          period
        }
      }
      transactionSummaryMap[key].totalQuantity += trans.quantity || 0
      transactionSummaryMap[key].count++
    })

    const transactionSummary = Object.values(transactionSummaryMap)

    // 7. Get stock movements (issues) per location for remarks
    const stockReductionsByLocation: Record<string, { itemName: string; quantity: number; recipient: string; date: string }[]> = {}
    
    transactions?.filter(t => t.transaction_type === "issue" || t.transaction_type === "assignment")
      .forEach(trans => {
        const loc = trans.location_name || trans.from_location || "Unknown"
        if (!stockReductionsByLocation[loc]) {
          stockReductionsByLocation[loc] = []
        }
        stockReductionsByLocation[loc].push({
          itemName: trans.item_name || "Unknown Item",
          quantity: trans.quantity || 0,
          recipient: trans.recipient || "Unknown",
          date: new Date(trans.created_at).toLocaleDateString()
        })
      })

    // 8. Get overall statistics
    const overallStats = {
      totalItems: storeItems?.length || 0,
      totalQuantity: storeItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
      totalLocations: Object.keys(locationStatsMap).length,
      lowStockItems: storeItems?.filter(item => item.quantity > 0 && item.quantity <= (item.reorder_level || 5)).length || 0,
      outOfStockItems: storeItems?.filter(item => item.quantity === 0).length || 0,
      transactionsThisPeriod: transactions?.length || 0,
      itemsIssuedThisPeriod: transactions?.filter(t => t.transaction_type === "issue" || t.transaction_type === "assignment").length || 0,
      itemsReceivedThisPeriod: transactions?.filter(t => t.transaction_type === "receipt" || t.transaction_type === "transfer_in").length || 0,
    }

    // 9. Get recent transactions for activity feed
    const recentTransactions = transactions?.slice(0, 20).map(trans => ({
      id: trans.id,
      itemName: trans.item_name,
      transactionType: trans.transaction_type,
      quantity: trans.quantity,
      location: trans.location_name || trans.to_location || trans.from_location,
      recipient: trans.recipient,
      createdAt: trans.created_at,
      notes: trans.notes
    })) || []

    return NextResponse.json({
      overallStats,
      locationStats,
      departmentStats,
      categoryStats,
      transactionSummary,
      stockReductionsByLocation,
      recentTransactions,
      period
    })

  } catch (error) {
    console.error("[v0] Inventory analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
