import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Query the profiles table to find user with matching username
    const { data: profiles, error: queryError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .eq("status", "approved")
      .single()

    if (queryError || !profiles) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password using pgcrypto
    const { data: authResult, error: authError } = await supabase.rpc("verify_password", {
      p_username: username,
      p_password: password,
    })

    if (authError || !authResult) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Return user data without password
    const { password_hash, ...userData } = profiles

    return NextResponse.json({
      success: true,
      user: userData,
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
