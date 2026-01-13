import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerClient()

    const username = request.headers.get("x-username")
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch user profile to check role
    const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single()

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Allow access to IT staff roles, but block regular users
    const allowedRoles = ["admin", "it_head", "regional_it_head", "it_staff", "it_store_head"]
    if (!allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Stock Balance Report is only accessible to IT staff." },
        { status: 403 },
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location") || "all"
    const deviceType = searchParams.get("deviceType") || "all"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 })
    }

    let itemsQuery = supabase.from("store_items").select("*").order("sku")

    if (location !== "all") {
      itemsQuery = itemsQuery.eq("location", location)
    } else if (profile.role === "regional_it_head") {
      // Regional IT heads can only see their location
      itemsQuery = itemsQuery.eq("location", profile.location)
    }

    if (deviceType !== "all") {
      itemsQuery = itemsQuery.eq("category", deviceType)
    }

    const { data: items, error: itemsError } = await itemsQuery

    if (itemsError) {
      console.error("[v0] Error fetching store items:", itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ report: [] })
    }

    const { data: requisitions } = await supabase
      .from("store_requisitions")
      .select("*")
      .gte("updated_at", startDate)
      .lte("updated_at", endDate)
      .in("status", ["approved", "issued"])

    const itemMovements: Record<string, { receipts: number; issues: number; requisitionCount: number }> = {}

    requisitions?.forEach((req) => {
      if (req.items && Array.isArray(req.items)) {
        req.items.forEach((item: any) => {
          const itemId = item.itemId || item.item_id
          if (!itemMovements[itemId]) {
            itemMovements[itemId] = { receipts: 0, issues: 0, requisitionCount: 0 }
          }

          if (req.status === "issued") {
            itemMovements[itemId].issues += item.quantity || 0
            itemMovements[itemId].requisitionCount++
          }
        })
      }
    })

    const stockBalanceData = items.map((item) => {
      const movements = itemMovements[item.id] || { receipts: 0, issues: 0, requisitionCount: 0 }
      const currentStock = item.quantity || 0
      const issues = movements.issues
      const receipts = movements.receipts

      const openingBalance = currentStock + issues - receipts

      return {
        code: item.sku || item.id.substring(0, 8),
        itemName: item.name || "Unknown",
        category: item.category || "IT Accessories",
        unitOfMeasure: item.unit || "Pcs",
        openingBalance,
        receipts,
        issues,
        closingBalance: currentStock,
        location: item.location || "Unknown",
        remarks: movements.requisitionCount > 0 ? `${movements.requisitionCount} requisition(s)` : "",
      }
    })

    return NextResponse.json({ report: stockBalanceData })
  } catch (error: any) {
    console.error("[v0] Error in stock-balance-report:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
