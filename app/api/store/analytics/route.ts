"use server"

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month" // week, month, quarter, year

    // Get date ranges
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

    // Get all store items by location
    const { data: storeItems, error: itemsError } = await supabase
      .from("store_items")
      .select("*")

    if (itemsError) {
      console.error("[v0] Error fetching store items:", itemsError)
    }

    // Get stock transactions for the period
    const { data: transactions, error: transError } = await supabase
      .from("stock_transactions")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })

    if (transError) {
      console.error("[v0] Error fetching transactions:", transError)
    }

    // Get stock assignments for the period
    const { data: assignments, error: assignError } = await supabase
      .from("stock_assignments")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })

    if (assignError) {
      console.error("[v0] Error fetching assignments:", assignError)
    }

    // Get stock transfer requests
    const { data: transferRequests, error: transferError } = await supabase
      .from("stock_transfer_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (transferError) {
      console.error("[v0] Error fetching transfer requests:", transferError)
    }

    // Calculate analytics
    const items = storeItems || []
    const txns = transactions || []
    const assigns = assignments || []
    const transfers = transferRequests || []

    // Location breakdown
    const locationStats: Record<string, { totalItems: number; totalQuantity: number; lowStock: number; outOfStock: number; value: number }> = {}
    
    items.forEach((item) => {
      const loc = item.location || "Unknown"
      if (!locationStats[loc]) {
        locationStats[loc] = { totalItems: 0, totalQuantity: 0, lowStock: 0, outOfStock: 0, value: 0 }
      }
      locationStats[loc].totalItems++
      locationStats[loc].totalQuantity += item.quantity || 0
      if (item.quantity === 0) locationStats[loc].outOfStock++
      else if (item.quantity <= (item.reorder_level || 5)) locationStats[loc].lowStock++
      locationStats[loc].value += (item.quantity || 0) * (item.unit_price || 0)
    })

    // Category breakdown
    const categoryStats: Record<string, { count: number; quantity: number }> = {}
    items.forEach((item) => {
      const cat = item.category || "Other"
      if (!categoryStats[cat]) {
        categoryStats[cat] = { count: 0, quantity: 0 }
      }
      categoryStats[cat].count++
      categoryStats[cat].quantity += item.quantity || 0
    })

    // Department breakdown from assignments
    const departmentStats: Record<string, { assignmentCount: number; itemCount: number }> = {}
    assigns.forEach((assign) => {
      const dept = assign.department || assign.assigned_to || "Unknown"
      if (!departmentStats[dept]) {
        departmentStats[dept] = { assignmentCount: 0, itemCount: 0 }
      }
      departmentStats[dept].assignmentCount++
      departmentStats[dept].itemCount += assign.quantity || 1
    })

    // Movement summary (issues vs receipts)
    // Accept multiple variants of transaction_type created across the codebase
    const isIssueType = (tt: string) => ["issue", "assigned", "assignment", "assignment_edit"].includes(tt)
    const isReceiptType = (tt: string) => ["received", "receipt", "added", "addition", "stock_in", "stock_addition", "initial_stock"].includes(tt)
    const isTransferType = (tt: string) => tt && (tt.startsWith("transfer") || tt === "transfer")

    const movementSummary = {
      totalIssues: txns.filter((t) => isIssueType(t.transaction_type)).length,
      totalReceipts: txns.filter((t) => isReceiptType(t.transaction_type)).length,
      totalTransfers: txns.filter((t) => isTransferType(t.transaction_type)).length,
      totalRequisitions: txns.filter((t) => t.transaction_type === "requisition").length,
    }

    // Recent activity (use location_name fallback)
    const recentActivity = txns.slice(0, 10).map((t) => ({
      id: t.id,
      type: t.transaction_type,
      itemName: t.item_name,
      quantity: t.quantity,
      location: t.location_name || t.location || t.to_location || t.from_location || "Unknown",
      performedBy: t.performed_by || t.performed_by_name,
      notes: t.notes,
      createdAt: t.created_at,
    }))

    // Stock reduction remarks by location
    const stockReductionByLocation: Record<string, { item: string; type: string; quantity: number; date: string }[]> = {}
    txns.filter((t) => isIssueType(t.transaction_type) || t.transaction_type === "transfer_out")
      .forEach((t) => {
        const loc = t.location_name || t.location || t.from_location || "Unknown"
        if (!stockReductionByLocation[loc]) {
          stockReductionByLocation[loc] = []
        }
        stockReductionByLocation[loc].push({
          item: t.item_name,
          type: t.transaction_type,
          quantity: t.quantity || 0,
          date: new Date(t.created_at).toLocaleDateString(),
        })
      })

    return NextResponse.json({
      success: true,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      summary: {
        totalItems: items.length,
        totalQuantity: items.reduce((sum, i) => sum + (i.quantity || 0), 0),
        totalLowStock: items.filter((i) => i.quantity > 0 && i.quantity <= (i.reorder_level || 5)).length,
        totalOutOfStock: items.filter((i) => i.quantity === 0).length,
        totalLocations: Object.keys(locationStats).length,
        totalCategories: Object.keys(categoryStats).length,
      },
      locationStats,
      categoryStats,
      departmentStats,
      movementSummary,
      recentActivity,
      stockReductionByLocation,
      pendingTransfers: transfers.filter((t) => t.status === "pending").length,
      recentTransfers: transfers.slice(0, 5),
    })
  } catch (error) {
    console.error("[v0] Analytics API error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
