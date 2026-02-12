import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCanonicalLocationName } from "@/lib/location-filter"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get all unique locations from profiles table
    const { data, error } = await supabase
      .from("profiles")
      .select("location")
      .not("location", "is", null)
      .neq("location", "")

    if (error) {
      console.error("[v0] Error fetching locations:", error)
      return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
    }

    // Map raw locations to canonical names, then deduplicate and sort
    const uniqueLocations = [...new Set(data.map((row) => getCanonicalLocationName(row.location)))].filter(Boolean).sort()

    return NextResponse.json({ success: true, locations: uniqueLocations })
  } catch (error: any) {
    console.error("[v0] Error in locations API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
