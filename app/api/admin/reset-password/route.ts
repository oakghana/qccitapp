import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, username, newPassword } = await request.json()

    if (!userId && !username) {
      return NextResponse.json({ error: "User ID or username is required" }, { status: 400 })
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    const supabase = await createClient()

    // Update the user's password in the profiles table
    const { data, error } = await supabase.rpc("reset_user_password", {
      p_username: username,
      p_new_password: newPassword,
    })

    if (error) {
      console.error("Error resetting password:", error)
      return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("Error in reset password API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
