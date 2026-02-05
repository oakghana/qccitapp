import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    // Extract unique locations and sort them
    const uniqueLocations = [...new Set(data.map((row) => row.location))].filter(Boolean).sort()

    return NextResponse.json({ success: true, locations: uniqueLocations })
  } catch (error: any) {
    console.error("[v0] Error in locations API:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
