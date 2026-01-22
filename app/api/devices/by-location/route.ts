import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

/**
 * Normalizes location string for consistent querying
 */
function normalizeLocation(location: string): string {
  return location.toLowerCase().replace(/[\s-]+/g, "_").trim()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location")
    const username = searchParams.get("username")

    if (!location) {
      return NextResponse.json({ error: "Location is required" }, { status: 400 })
    }

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 401 })
    }

    // Normalize location for consistent querying
    const normalizedLocation = normalizeLocation(location)
    console.log("[v0] Fetching devices for location:", location, "→ normalized:", normalizedLocation)

    const supabase = await createServerClient()

    // Verify user exists
    const { data: userProfile } = await supabase.from("profiles").select("*").eq("username", username).single()

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    // Fetch devices for the specified location (case-insensitive with normalized value)
    const { data: devices, error } = await supabase
      .from("devices")
      .select("*")
      .or(`location.eq.${normalizedLocation},location.ilike.${location},location.ilike.${normalizedLocation}`)
      .order("brand", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching location devices:", error)
      return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
    }

    console.log("[v0] Found", devices?.length || 0, "devices for location:", normalizedLocation)
    return NextResponse.json(devices || [])
  } catch (error) {
    console.error("[v0] Error in by-location route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
