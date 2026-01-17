import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { username, name } = await request.json()

    if (!username || !name) {
      return NextResponse.json({ error: "Username and name are required" }, { status: 400 })
    }

    if (name.trim().length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters long" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Update user name in profiles table
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("username", username)
      .select()
      .single()

    if (error) {
      console.error("[v0] Profile update error:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: data.id,
        username: data.username,
        email: data.email,
        name: data.full_name,
        role: data.role,
        location: data.location,
      },
    })
  } catch (error) {
    console.error("[v0] Profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
