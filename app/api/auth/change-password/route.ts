import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function POST(request: NextRequest) {
  try {
    const { username, currentPassword, newPassword } = await request.json()

    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 })
    }

    const supabase = createClient()

    // Verify current password by calling the database function
    const { data: verifyData, error: verifyError } = await supabase.rpc("verify_password", {
      p_username: username,
      p_password: currentPassword,
    })

    if (verifyError || !verifyData) {
      console.error("[v0] Password verification error:", verifyError)
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    // Update password using raw SQL with crypt function
    const { error: updateError } = await supabase.rpc("update_password", {
      p_username: username,
      p_new_password: newPassword,
    })

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
