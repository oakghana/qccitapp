import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, role, location, department, password, createdBy, username, status } = body

    console.log("[v0] Creating user:", { email, role, location, username })

    const passwordToHash = password || "qcc@123"
    // Use fixed hash for default password qcc@123 to ensure consistency
    const hashedPassword = password 
      ? await bcrypt.hash(passwordToHash, 10) 
      : "$2b$10$y.4.eCKGm0kI0hXv1rhJtuLYpKJH3R/Pfxvn9AU6DVF5PzYHsnmqm"

    // Use provided username or fall back to email
    const finalUsername = username || email

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", finalUsername)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        username: finalUsername,
        email: email,
        full_name: name,
        role: role,
        location: location,
        phone: phone || "+233XXXXXXXXX",
        department: department || "ITD",
        password_hash: hashedPassword,
        status: status || "approved",
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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

    console.log("[v0] User created successfully:", data.username)

    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        location: data.location,
        department: data.department,
      },
      password: passwordToHash,
    })
  } catch (error: any) {
    console.error("[v0] Error in create-user API:", error)
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 })
  }
}
