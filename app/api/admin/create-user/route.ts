import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

import { LOCATIONS } from "@/lib/locations"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DEFAULT_PASSWORD_HASH = "$2b$10$y.4.eCKGm0kI0hXv1rhJtuLYpKJH3R/Pfxvn9AU6DVF5PzYHsnmqm"

function normalizeLocation(location?: string | null) {
  if (!location) return "Head Office"
  return LOCATIONS[location as keyof typeof LOCATIONS] || location
}

function mapStatus(status?: string | null) {
  if (status === "approved" || status === "active") return { status: "approved", is_active: true }
  if (status === "suspended") return { status: "suspended", is_active: false }
  return { status: "pending", is_active: false }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const list = searchParams.get("list")

  if (list === "department_heads") {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "department_head")
      .eq("is_active", true)
      .order("full_name", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const users = (data || []).map((u: any) => ({
      id: u.id,
      name: u.full_name || u.email,
      email: u.email,
    }))

    return NextResponse.json({ users })
  }

  return NextResponse.json({ error: "Invalid query" }, { status: 400 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, role, location, department, password, createdBy, username, status } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const finalUsername = username || email
    const passwordToHash = password || "qcc@123"
    const hashedPassword = password ? await bcrypt.hash(passwordToHash, 10) : DEFAULT_PASSWORD_HASH
    const activation = mapStatus(status)

    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .or(`username.eq.${finalUsername},email.eq.${email}`)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        username: finalUsername,
        email,
        full_name: name,
        role: role || "staff",
        location: normalizeLocation(location),
        phone: phone || "+233XXXXXXXXX",
        department: department || "ITD",
        password_hash: hashedPassword,
        status: activation.status,
        is_active: activation.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase.from("audit_logs").insert({
      user_id: data.id,
      username: createdBy || "system",
      action: "USER_CREATED",
      resource: `profiles/${data.id}`,
      details: `Created new user: ${data.full_name} (${data.email}) with role ${data.role} at ${data.location}`,
      severity: "medium",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    return NextResponse.json({ success: true, user: data, password: passwordToHash })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, email, phone, role, location, department, status, action, password } = body

    if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 })

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    let plainPassword: string | null = null

    if (action === "reset_password") {
      plainPassword = password || "qcc@123"
      updates.password_hash = plainPassword === "qcc@123" ? DEFAULT_PASSWORD_HASH : await bcrypt.hash(plainPassword, 10)
    } else {
      if (name !== undefined) updates.full_name = name
      if (email !== undefined) {
        updates.email = email
        updates.username = email
      }
      if (phone !== undefined) updates.phone = phone
      if (role !== undefined) updates.role = role
      if (location !== undefined) updates.location = normalizeLocation(location)
      if (department !== undefined) updates.department = department
      if (status !== undefined) {
        const activation = mapStatus(status)
        updates.status = activation.status
        updates.is_active = activation.is_active
      }
    }

    const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, user: data, password: plainPassword })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 })

    const { error } = await supabase.from("profiles").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 })
  }
}
