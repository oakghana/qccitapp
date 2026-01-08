import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, role, location, department, password } = body

    console.log("[v0] Creating user:", { email, role, location })

    const passwordToHash = password || "qcc@123"
    const hashedPassword = await bcrypt.hash(passwordToHash, 10)

    console.log("[v0] Generated password hash:", hashedPassword.substring(0, 30))

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        username: email,
        email: email,
        full_name: name,
        role: role,
        location: location,
        phone: phone || "+233XXXXXXXXX",
        department: department || "ITD",
        password_hash: hashedPassword,
        status: "approved",
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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
