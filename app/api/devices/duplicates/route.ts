import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userRole = searchParams.get("userRole") || ""
    const userLocation = searchParams.get("location") || ""

    // Only admin and regional_it_head can access duplicates
    if (!["admin", "regional_it_head", "it_head"].includes(userRole)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Fetch all devices (optionally scoped to location for regional heads)
    let query = supabaseAdmin
      .from("devices")
      .select("id, serial_number, brand, model, device_type, location, status, asset_tag, assigned_to, created_at")
      .order("serial_number")

    if (userRole === "regional_it_head" && userLocation) {
      query = query.ilike("location", `%${userLocation}%`)
    }

    const { data: devices, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by serial_number to find duplicates
    const bySerial: Record<string, any[]> = {}
    for (const device of devices || []) {
      const key = (device.serial_number || "").trim().toLowerCase()
      if (!key) continue
      if (!bySerial[key]) bySerial[key] = []
      bySerial[key].push(device)
    }

    // Keep only groups with more than 1 entry
    const duplicateGroups = Object.entries(bySerial)
      .filter(([, group]) => group.length > 1)
      .map(([serial, group]) => ({
        serial_number: serial,
        count: group.length,
        devices: group,
      }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      duplicateGroups,
      totalDuplicates: duplicateGroups.reduce((sum, g) => sum + g.count - 1, 0),
      affectedSerials: duplicateGroups.length,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
