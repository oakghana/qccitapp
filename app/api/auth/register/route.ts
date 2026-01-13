import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, fullName, password, phone, department, location } = body

    console.log("[v0] Registration request:", { username, email, fullName, location })

    // Validate required fields
    if (!username || !email || !fullName || !location) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .or(`username.eq.${username},email.eq.${email}`)
      .maybeSingle()

    if (checkError) {
      console.error("[v0] Error checking existing user:", checkError)
    }

    if (existingUser) {
      console.log("[v0] User already exists")
      return NextResponse.json({ message: "Username or email already exists" }, { status: 409 })
    }

    const defaultPassword = "pa$$w0rd"

    console.log("[v0] Creating new user profile...")

    const { data: newUser, error } = await supabase
      .from("profiles")
      .insert([
        {
          username,
          email,
          full_name: fullName,
          phone: phone || null,
          department: department || "General",
          location,
          password_hash: defaultPassword, // Database trigger will hash this
          role: "user", // Default role for self-registered users
          status: "approved", // Auto-approve with "user" role
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("[v0] Registration error:", error)
      return NextResponse.json({ message: "Registration failed. Please try again." }, { status: 500 })
    }

    console.log("[v0] User registered successfully:", newUser.id)

    return NextResponse.json(
      {
        message: "Registration successful. Your default password is: pa$$w0rd. Please change it after first login.",
        userId: newUser.id,
        defaultPassword: "pa$$w0rd", // Send default password in response
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 })
  }
}
