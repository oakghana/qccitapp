import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location")
    const analysisType = searchParams.get("type") || "replacement"
    const userRole = searchParams.get("user_role")
    const userLocation = searchParams.get("user_location")

    console.log("[v0] Regional needs analysis - location:", location, "type:", analysisType, "user_role:", userRole)

    // Authorization check - only admin, it_head, and regional_it_head can access
    if (!["admin", "it_head", "regional_it_head"].includes(userRole || "")) {
      console.error("[v0] Unauthorized access attempt to regional needs analysis")
      return NextResponse.json({ error: "Unauthorized. This page is only accessible to IT administrators." }, { status: 403 })
    }

    // Regional IT heads can only view their own location
    let effectiveLocation = location
    if (userRole === "regional_it_head") {
      effectiveLocation = userLocation || location
      if (!effectiveLocation || effectiveLocation === "all") {
        return NextResponse.json({ error: "Regional IT heads must have a valid location assigned." }, { status: 400 })
      }
      console.log("[v0] Regional IT head restricted to location:", effectiveLocation)
    }

    if (analysisType === "replacement") {
      // Get devices needing replacement using correct view name
      let query = supabase
        .from("v_devices_replacement_needed")
        .select("*")
        .order("device_age_years", { ascending: false })

      if (effectiveLocation && effectiveLocation !== "all") {
        query = query.eq("location", effectiveLocation)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching replacement recommendations:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ recommendations: data || [] })
    }

    if (analysisType === "toner") {
      // Get toner needs using correct view name
      let query = supabase
        .from("v_printer_toner_needs")
        .select("*")
        .order("monthly_toner_units_needed", { ascending: false })

      if (effectiveLocation && effectiveLocation !== "all") {
        query = query.eq("location", effectiveLocation)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching toner needs:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ tonerNeeds: data || [] })
    }

    if (analysisType === "stock") {
      // Get all store items and filter in application code
      // (PostgREST doesn't support comparing two columns directly)
      let query = supabase
        .from("store_items")
        .select("*")
        .order("quantity", { ascending: true })

      if (effectiveLocation && effectiveLocation !== "all") {
        query = query.eq("location", effectiveLocation)
      }

      const { data, error} = await query

      if (error) {
        console.error("[v0] Error fetching stock replenishment needs:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Filter items below reorder level or null quantity
      const itemsBelowReorderLevel = (data || []).filter(item => {
        const currentQty = item.quantity || 0
        const reorderLevel = item.reorder_level || 0
        return currentQty <= reorderLevel || item.quantity === null
      })

      // Calculate monthly procurement needs based on usage patterns
      const stockNeeds = itemsBelowReorderLevel.map((item) => {
        const currentQty = item.quantity || 0
        const reorderLevel = item.reorder_level || 0
        const shortage = Math.max(0, reorderLevel - currentQty)
        const recommendedOrder = shortage + Math.ceil(reorderLevel * 0.5) // Order 50% above reorder level as buffer
        
        return {
          ...item,
          shortage,
          recommendedOrder,
          urgency: currentQty === 0 ? "critical" : currentQty < reorderLevel * 0.5 ? "high" : "medium",
        }
      })

      return NextResponse.json({ stockNeeds: stockNeeds || [] })
    }

    if (analysisType === "summary") {
      // Comprehensive location summary with devices, stock, and recommendations
      
      // 1. Get devices by location
      let devicesQuery = supabase
        .from("devices")
        .select("id, device_type, status, location, assigned_to, created_at")
      
      if (effectiveLocation && effectiveLocation !== "all") {
        devicesQuery = devicesQuery.eq("location", effectiveLocation)
      }
      
      const { data: devices } = await devicesQuery
      
      // 2. Get stock items by location
      let stockQuery = supabase
        .from("store_items")
        .select("name, quantity, reorder_level, location, category")
      
      if (effectiveLocation && effectiveLocation !== "all") {
        stockQuery = stockQuery.eq("location", effectiveLocation)
      }
      
      const { data: stockItems } = await stockQuery
      
      // 3. Get devices needing replacement
      let replacementQuery = supabase
        .from("v_devices_replacement_needed")
        .select("*")
      
      if (effectiveLocation && effectiveLocation !== "all") {
        replacementQuery = replacementQuery.eq("location", effectiveLocation)
      }
      
      const { data: replacementNeeded } = await replacementQuery
      
      // 4. Calculate summary metrics
      const summary = {
        location: effectiveLocation || "All Locations",
        devices: {
          total: devices?.length || 0,
          active: devices?.filter(d => d.status === "active").length || 0,
          assigned: devices?.filter(d => d.assigned_to).length || 0,
          unassigned: devices?.filter(d => !d.assigned_to).length || 0,
          needingReplacement: replacementNeeded?.length || 0
        },
        stock: {
          totalItems: stockItems?.length || 0,
          totalQuantity: stockItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
          lowStock: stockItems?.filter(item => item.quantity <= item.reorder_level).length || 0,
          outOfStock: stockItems?.filter(item => item.quantity === 0).length || 0,
          needsReorder: stockItems?.filter(item => item.quantity <= item.reorder_level) || []
        },
        recommendations: [] as string[]
      }
      
      // 5. Generate recommendations
      if (summary.devices.needingReplacement > 0) {
        summary.recommendations.push(`Replace ${summary.devices.needingReplacement} aging devices to maintain operational efficiency`)
      }
      
      if (summary.stock.outOfStock > 0) {
        summary.recommendations.push(`URGENT: ${summary.stock.outOfStock} items are out of stock - request immediate replenishment`)
      } else if (summary.stock.lowStock > 0) {
        summary.recommendations.push(`${summary.stock.lowStock} items below reorder level - initiate stock requisition`)
      }
      
      if (summary.devices.unassigned > 0 && summary.devices.unassigned > summary.devices.total * 0.2) {
        summary.recommendations.push(`${summary.devices.unassigned} devices unassigned - review allocation and assign to users`)
      }
      
      const deviceUtilization = summary.devices.total > 0 ? (summary.devices.assigned / summary.devices.total * 100) : 0
      if (deviceUtilization < 70) {
        summary.recommendations.push(`Device utilization at ${deviceUtilization.toFixed(0)}% - consider redistributing unassigned devices`)
      }
      
      if (summary.stock.totalItems === 0) {
        summary.recommendations.push(`No stock items at this location - request initial stock allocation from Central Stores`)
      }

      return NextResponse.json({ summary })
    }

    return NextResponse.json({ error: "Invalid analysis type" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Error in regional needs analysis API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
