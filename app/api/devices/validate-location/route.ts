import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serialNumber, location, excludeDeviceId } = body

    console.log("[v0] Validating device location:", {
      serialNumber,
      location,
    })

    // Validate input
    if (!serialNumber || serialNumber.trim() === "") {
      return NextResponse.json(
        { error: "Serial number is required" },
        { status: 400 }
      )
    }

    if (!location || location.trim() === "") {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      )
    }

    // Check for duplicate
    let query = supabase
      .from("devices")
      .select("id, serial_number, brand, model, location, status, created_at")
      .eq("serial_number", serialNumber)
      .eq("location", location)

    if (excludeDeviceId) {
      query = query.neq("id", excludeDeviceId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error checking duplicate:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const isDuplicate = (data && data.length > 0) ? true : false
    const existingDevice = isDuplicate ? data[0] : null

    console.log("[v0] Validation result:", {
      isDuplicate,
      hasExisting: !!existingDevice,
    })

    return NextResponse.json({
      isDuplicate,
      existingDevice: existingDevice || null,
      message: isDuplicate 
        ? `Device with this serial number already exists at ${location}` 
        : "Device is valid for this location",
    })
  } catch (error: any) {
    console.error("[v0] Error in validate-location API:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const serialNumber = searchParams.get("serialNumber")
    const location = searchParams.get("location")

    if (!serialNumber || !location) {
      return NextResponse.json(
        { error: "serialNumber and location parameters are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("serial_number", serialNumber)
      .eq("location", location)

    if (error) {
      console.error("[v0] Error validating location:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const isDuplicate = (data && data.length > 0) ? true : false

    return NextResponse.json({
      isDuplicate,
      existingDevice: isDuplicate ? data[0] : null,
    })
  } catch (error: any) {
    console.error("[v0] Error in validate-location GET:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
