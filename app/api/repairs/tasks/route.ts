import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceProviderId = searchParams.get("service_provider_id")
    const status = searchParams.get("status")
    const viewAll = searchParams.get("viewAll") === "true"

    console.log("[v0] API Repair Tasks - service_provider_id:", serviceProviderId, "status:", status, "viewAll:", viewAll)

    // If service_provider_id is a user ID, look up the actual service provider ID
    let actualServiceProviderId = serviceProviderId
    let serviceProviderName = null
    
    if (serviceProviderId && !viewAll) {
      // First, check if this is a user ID by looking up service_providers table via user_id
      const { data: spDataByUserId, error: spErrorByUserId } = await supabaseAdmin
        .from("service_providers")
        .select("id, name")
        .eq("user_id", serviceProviderId)
        .single()
      
      if (spDataByUserId) {
        console.log("[v0] Found service provider via user_id:", spDataByUserId.id, spDataByUserId.name)
        actualServiceProviderId = spDataByUserId.id
        serviceProviderName = spDataByUserId.name
      } else {
        // If not found via user_id, check if the ID is already a service_provider ID
        const { data: spDataById, error: spErrorById } = await supabaseAdmin
          .from("service_providers")
          .select("id, name")
          .eq("id", serviceProviderId)
          .single()
        
        if (spDataById) {
          console.log("[v0] ID is already a service_provider ID:", spDataById.id, spDataById.name)
          actualServiceProviderId = spDataById.id
          serviceProviderName = spDataById.name
        } else {
          // Try finding by matching the name in profiles table
          const { data: profileData } = await supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", serviceProviderId)
            .single()
          
          if (profileData?.full_name) {
            // Look up service provider by name
            const { data: spByName } = await supabaseAdmin
              .from("service_providers")
              .select("id, name")
              .ilike("name", `%${profileData.full_name}%`)
              .single()
            
            if (spByName) {
              console.log("[v0] Found service provider by profile name:", spByName.id, spByName.name)
              actualServiceProviderId = spByName.id
              serviceProviderName = spByName.name
            }
          }
          
          console.log("[v0] No direct service_provider mapping found, will also check by name")
        }
      }
      
      console.log("[v0] Final service provider ID for query:", actualServiceProviderId, "Name:", serviceProviderName)
    }

    // Query from repair_requests table (the actual repairs table)
    let query = supabaseAdmin
      .from("repair_requests")
      .select(`
        *,
        devices (
          id,
          serial_number,
          asset_tag,
          device_type,
          brand,
          model,
          location
        ),
        service_providers (
          id,
          name,
          email,
          phone
        ),
        repair_invoices:repair_invoices!repair_id (
          id,
          file_url,
          status,
          total_amount,
          invoice_number,
          created_at
        )
      `)
      .order("created_at", { ascending: false })

    // If viewAll is true (admin), show all repairs that have a service provider assigned
    if (viewAll) {
      query = query.not("service_provider_id", "is", null)
      console.log("[v0] Querying all repairs with service provider assigned")
    } else if (actualServiceProviderId || serviceProviderName) {
      // Try to find repairs by service_provider_id OR by service_provider_name
      if (actualServiceProviderId) {
        query = query.eq("service_provider_id", actualServiceProviderId)
        console.log("[v0] Querying repairs for service_provider_id:", actualServiceProviderId)
      }
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error loading repair tasks:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data to match expected format
    const transformedTasks = (data || []).map((repair: any) => ({
      id: repair.id,
      task_number: repair.task_number || `REP-${repair.id.substring(0, 8).toUpperCase()}`,
      device_info: {
        type: repair.devices?.device_type || "Unknown",
        brand: repair.devices?.brand || "Unknown",
        model: repair.devices?.model || "Unknown",
        serialNumber: repair.devices?.serial_number || "",
        assetTag: repair.devices?.asset_tag || repair.devices?.serial_number || "",
      },
      issue_description: repair.issue_description || repair.description || "",
      priority: repair.priority || "medium",
      status: repair.status || "assigned",
      assigned_by_name: repair.assigned_by || repair.created_by || "IT Department",
      assigned_date: repair.assigned_at || repair.created_at,
      scheduled_pickup_date: repair.scheduled_pickup_date,
      collected_date: repair.collected_date,
      estimated_completion_date: repair.estimated_completion_date,
      completed_date: repair.completed_at,
      location: repair.devices?.location || repair.location || "",
      repair_notes: repair.repair_notes || repair.notes,
      parts_used: repair.parts_used,
      labor_hours: repair.labor_hours,
      actual_cost: repair.actual_cost,
      service_provider_id: repair.service_provider_id,
      service_provider_name: repair.service_providers?.name || repair.service_provider_name || "Unknown",
      service_provider_email: repair.service_providers?.email,
      service_provider_phone: repair.service_providers?.phone,
      invoice: repair.repair_invoices?.[0] ? {
        id: repair.repair_invoices[0].id,
        file_url: repair.repair_invoices[0].file_url,
        status: repair.repair_invoices[0].status,
        total_amount: repair.repair_invoices[0].total_amount,
        invoice_number: repair.repair_invoices[0].invoice_number,
        created_at: repair.repair_invoices[0].created_at,
      } : null,
    }))

    console.log("[v0] Loaded repair tasks:", transformedTasks.length)

    return NextResponse.json({ tasks: transformedTasks })
  } catch (error) {
    console.error("[v0] API Repair Tasks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Creating repair task:", body)

    const { data, error } = await supabaseAdmin
      .from("repair_tasks")
      .insert({
        repair_request_id: body.repair_request_id,
        device_id: body.device_id,
        device_info: body.device_info,
        service_provider_id: body.service_provider_id,
        service_provider_name: body.service_provider_name,
        issue_description: body.issue_description,
        priority: body.priority || "medium",
        status: "assigned",
        assigned_by: body.assigned_by,
        assigned_by_name: body.assigned_by_name,
        location: body.location,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating repair task:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Created repair task:", data)

    return NextResponse.json({ task: data })
  } catch (error) {
    console.error("[v0] API Repair Tasks POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    console.log("[v0] Updating repair task:", id, updates)

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from("repair_tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating repair task:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Updated repair task:", data)

    return NextResponse.json({ task: data })
  } catch (error) {
    console.error("[v0] API Repair Tasks PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
