import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, role, location, department, password } = body

    console.log("[v0] Creating user:", { email, role, location })

    const supabase = createClient()

    // Create user in profiles table with hashed password
    const { data, error } = await supabase.rpc("create_user_with_password", {
      p_username: email,
      p_email: email,
      p_full_name: name,
      p_role: role,
      p_location: location,
      p_phone: phone || "+233XXXXXXXXX",
      p_department: department || "ITD",
      p_password: password || "qcc@123", // Updated default password from qccghana123 to qcc@123
    })

    if (error) {
      console.error("[v0] Error creating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] User created successfully:", data)

    return NextResponse.json({ success: true, user: data })
  } catch (error: any) {
    console.error("[v0] Error in create-user API:", error)
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 })
  }
}
