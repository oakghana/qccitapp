import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { username, currentPassword, newPassword } = await request.json()

    console.log("[v0] Change password request for:", username)

    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: userData, error: fetchError } = await supabase
      .from("profiles")
      .select("password_hash, status, is_active")
      .eq("username", username)
      .single()

    if (fetchError || !userData) {
      console.error("[v0] User fetch error:", fetchError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("[v0] User data fetched, has password_hash:", !!userData.password_hash)

    if (userData.status !== "approved" || !userData.is_active) {
      return NextResponse.json({ error: "Account is not active" }, { status: 403 })
    }

    if (!userData.password_hash) {
      return NextResponse.json(
        {
          error: "No password set for this account. Please contact an administrator to set an initial password.",
        },
        { status: 400 },
      )
    }

    const isPasswordValid = await bcrypt.compare(String(currentPassword), String(userData.password_hash))

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    const newPasswordHash = await bcrypt.hash(String(newPassword), 10)

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("username", username)

    if (updateError) {
      console.error("[v0] Password update error:", updateError)
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    })
  } catch (error) {
    console.error("[v0] Change password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
