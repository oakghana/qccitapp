import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  
  // Check VR and similar locations
  const { data: vrDevices, error: vrError } = await supabase
    .from("devices")
    .select("*")
    .or("location.ilike.%vr%,location.ilike.%volta%")
    .order("updated_at", { ascending: false })
  
  if (vrError) {
    return NextResponse.json({ error: vrError.message }, { status: 500 })
  }
  
  // Get all location counts
  const { data: allLocations, error: locError } = await supabase
    .from("devices")
    .select("location")
  
  if (locError) {
    return NextResponse.json({ error: locError.message }, { status: 500 })
  }
  
  // Count by location
  const locationCounts: Record<string, number> = {}
  allLocations?.forEach(device => {
    const loc = device.location || "empty"
    locationCounts[loc] = (locationCounts[loc] || 0) + 1
  })
  
  // Get recently updated devices (last 48 hours)
  const { data: recentUpdates, error: updateError } = await supabase
    .from("devices")
    .select("id, device_type, brand, model, location, updated_at")
    .gte("updated_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
    .order("updated_at", { ascending: false })
    .limit(50)
  
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }
  
  return NextResponse.json({
    vrDevices: vrDevices || [],
    vrDeviceCount: vrDevices?.length || 0,
    locationCounts,
    recentUpdates: recentUpdates || []
  })
}
