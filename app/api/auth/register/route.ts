import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, fullName, password, phone, department, location } = body

    // Validate required fields
    if (!username || !email || !fullName || !password || !location) {
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
          password_hash: password, // This will be hashed by the database trigger
          status: "pending", // Set status as pending approval
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
        message: "Registration successful. Your account is pending approval.",
        userId: newUser.id,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "An error occurred during registration" }, { status: 500 })
  }
}
