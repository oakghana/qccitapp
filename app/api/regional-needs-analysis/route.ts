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
      // Get store items below reorder level for replenishment
      let query = supabase
        .from("store_items")
        .select("*")
        .or("quantity.lte.reorder_level,quantity.is.null")
        .order("quantity", { ascending: true })

      if (effectiveLocation && effectiveLocation !== "all") {
        query = query.eq("location", effectiveLocation)
      }

      const { data, error} = await query

      if (error) {
        console.error("[v0] Error fetching stock replenishment needs:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Calculate monthly procurement needs based on usage patterns
      const stockNeeds = (data || []).map((item) => {
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
      // Get location summary
      const { data, error } = await supabase
        .rpc("generate_regional_needs_report", {
          p_location: effectiveLocation === "all" ? null : effectiveLocation,
          p_period: "monthly"
        })

      if (error) {
        console.error("[v0] Error generating regional needs report:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ summary: data || [] })
    }

    return NextResponse.json({ error: "Invalid analysis type" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Error in regional needs analysis API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
