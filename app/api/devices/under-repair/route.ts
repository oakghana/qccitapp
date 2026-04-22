import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const serviceProviderId = searchParams.get("service_provider_id")
    const location = searchParams.get("location")

    console.log("[v0] Fetching devices under repair - status:", status, "provider:", serviceProviderId)

    // Query devices marked with repair-related status values (maintenance, under_repair, or repair)
    let query = supabaseAdmin
      .from("devices")
      .select(
        `
        id,
        name,
        device_type,
        brand,
        model,
        serial_number,
        asset_tag,
        status,
        location,
        assigned_to,
        created_at,
        updated_at,
        repair_requests (
          id,
          status,
          issue_description,
          priority,
          service_provider_id,
          service_providers (
            id,
            name,
            email,
            phone
          ),
          estimated_completion,
          created_at
        )
      `
      )
      .in("status", ["repair", "under_repair", "maintenance"])
      .order("updated_at", { ascending: false })

    if (location) {
      query = query.eq("location", location)
    }

    const { data: devices, error: devicesError } = await query

    if (devicesError) {
      console.error("[v0] Error fetching devices under repair:", devicesError)
      return NextResponse.json(
        { error: devicesError.message },
        { status: 500 }
      )
    }

    // Filter and transform the data
    let filteredDevices = (devices || []).map((device: any) => {
      const repairRequest = device.repair_requests?.[0]
      return {
        id: device.id,
        name: device.name || `${device.brand} ${device.model}`,
        device_type: device.device_type,
        brand: device.brand,
        model: device.model,
        serial_number: device.serial_number,
        asset_tag: device.asset_tag,
        status: device.status,
        location: device.location,
        assigned_to: device.assigned_to,
        created_at: device.created_at,
        updated_at: device.updated_at,
        repair: {
          id: repairRequest?.id,
          status: repairRequest?.status || "pending",
          issue_description: repairRequest?.issue_description,
          priority: repairRequest?.priority || "medium",
          estimated_completion: repairRequest?.estimated_completion,
          created_at: repairRequest?.created_at,
          service_provider: repairRequest?.service_providers
            ? {
                id: repairRequest.service_providers.id,
                name: repairRequest.service_providers.name,
                email: repairRequest.service_providers.email,
                phone: repairRequest.service_providers.phone,
              }
            : null,
        },
      }
    })

    // Filter by service provider if specified
    if (serviceProviderId) {
      filteredDevices = filteredDevices.filter(
        (d: any) => d.repair?.service_provider?.id === serviceProviderId
      )
    }

    // Filter by repair status if specified
    if (status && status !== "all") {
      filteredDevices = filteredDevices.filter(
        (d: any) => d.repair?.status === status
      )
    }

    return NextResponse.json({
      devices: filteredDevices,
      total: filteredDevices.length,
    })
  } catch (error: any) {
    console.error("[v0] Error in devices under repair API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, serviceProviderId, issueDescription, priority } = body

    if (!deviceId || !serviceProviderId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if repair request already exists
    const { data: existingRepair } = await supabaseAdmin
      .from("repair_requests")
      .select("id")
      .eq("device_id", deviceId)
      .single()

    if (existingRepair) {
      // Update existing repair request
      const { error: updateError } = await supabaseAdmin
        .from("repair_requests")
        .update({
          service_provider_id: serviceProviderId,
          status: "assigned",
          issue_description: issueDescription,
          priority: priority || "medium",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingRepair.id)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: "Repair request updated",
      })
    } else {
      // Create new repair request
      const { error: createError } = await supabaseAdmin
        .from("repair_requests")
        .insert({
          device_id: deviceId,
          service_provider_id: serviceProviderId,
          status: "assigned",
          issue_description: issueDescription || "Device sent for repair",
          priority: priority || "medium",
          created_at: new Date().toISOString(),
        })

      if (createError) throw createError

      return NextResponse.json({
        success: true,
        message: "Repair request created",
      })
    }
  } catch (error: any) {
    console.error("[v0] Error in devices under repair POST API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
