import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

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

    const supabase = await createServerClient()

    // Verify user exists
    const { data: userProfile } = await supabase.from("profiles").select("*").eq("username", username).single()

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    // Fetch devices for the specified location (case-insensitive)
    const { data: devices, error } = await supabase
      .from("devices")
      .select("*")
      .ilike("location", location)
      .order("brand", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching location devices:", error)
      return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 })
    }

    return NextResponse.json(devices || [])
  } catch (error) {
    console.error("[v0] Error in by-location route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
