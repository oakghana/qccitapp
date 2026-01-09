import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { userId, name, email, phone, role, location, password, changePassword } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const updateData: any = {
      full_name: name,
      email: email,
      phone: phone,
      role: role,
      location: location,
      updated_at: new Date().toISOString(),
    }

    if (changePassword && password && password.length >= 6) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.password_hash = hashedPassword
    }

    // Update user profile
    const { data, error } = await supabase.from("profiles").update(updateData).eq("id", userId).select()

    if (error) {
      console.error("[v0] Error updating user:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    console.log("[v0] User updated successfully:", data)

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: data[0],
    })
  } catch (error) {
    console.error("[v0] Error in update user API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
