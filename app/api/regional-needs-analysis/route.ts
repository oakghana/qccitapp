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
      // Get devices needing replacement
      let query = supabase
        .from("device_replacement_recommendations")
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
      // Get monthly toner needs
      let query = supabase
        .from("monthly_toner_needs")
        .select("*")
        .order("estimated_toners_needed_monthly", { ascending: false })

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
