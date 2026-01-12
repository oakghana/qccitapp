import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, fullName, password, phone, department, location } = body

    // Validate required fields
    if (!username || !email || !fullName || !location) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .or(`username.eq.${username},email.eq.${email}`)
      .single()

    if (existingUser) {
      return NextResponse.json({ message: "Username or email already exists" }, { status: 409 })
    }

    const defaultPassword = "pa$$w0rd"

    // Hash password using pgcrypto
    const { data: newUser, error } = await supabase
      .from("profiles")
      .insert([
        {
          username,
          email,
          full_name: fullName,
          phone,
          department,
          location,
          password_hash: defaultPassword, // This will be hashed by the database trigger
          role: "user", // Default role for self-registered users
          status: "approved", // Auto-approve with "user" role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Registration error:", error)
      return NextResponse.json({ message: "Registration failed. Please try again." }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: "Registration successful. Your default password is: pa$$w0rd. Please change it after first login.",
        userId: newUser.id,
        defaultPassword: "pa$$w0rd", // Send default password in response
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 })
  }
}
