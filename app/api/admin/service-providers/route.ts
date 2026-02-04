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
    const activeOnly = searchParams.get("activeOnly") !== "false"

    console.log("[v0] Fetching service providers with service_provider role, activeOnly:", activeOnly)

    // Fetch from profiles table where role = 'service_provider' and status = 'approved' (active)
    let query = supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, location, department, status, role")
      .eq("role", "service_provider")
      .eq("status", "approved") // Only approved/active users
      .order("full_name", { ascending: true })

    const { data: profData, error: profError } = await query

    if (profError) {
      console.error("[v0] Error fetching service providers from profiles:", profError)
      return NextResponse.json({ error: profError.message }, { status: 500 })
    }

    console.log("[v0] Loaded active service providers with service_provider role:", profData?.length || 0)

    const providers = (profData || []).map((provider: any) => ({
      id: provider.id,
      name: provider.full_name || provider.email,
      email: provider.email,
      phone: provider.phone,
      location: provider.location,
      department: provider.department,
      specialization: [], // Can be enhanced later
      is_active: provider.status === "approved",
    }))

    return NextResponse.json({ providers: providers, count: providers.length })
  } catch (error) {
    console.error("[v0] API Service Providers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] Creating service provider:", body)

    const { data, error } = await supabaseAdmin
      .from("service_providers")
      .insert({
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        specialization: body.specialization || [],
        location: body.location || null,
        is_active: body.is_active !== false,
        notes: body.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating service provider:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Service provider created:", data)

    return NextResponse.json({ provider: data })
  } catch (error) {
    console.error("[v0] API Service Providers POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
    }

    console.log("[v0] Updating service provider:", id)

    const { data, error } = await supabaseAdmin
      .from("service_providers")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating service provider:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ provider: data })
  } catch (error) {
    console.error("[v0] API Service Providers PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Provider ID is required" }, { status: 400 })
    }

    console.log("[v0] Deleting service provider:", id)

    // Soft delete by setting is_active to false
    const { data, error } = await supabaseAdmin
      .from("service_providers")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error deleting service provider:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, provider: data })
  } catch (error) {
    console.error("[v0] API Service Providers DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
