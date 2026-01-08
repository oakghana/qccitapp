import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, name, email, phone, role, location, password, changePassword } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Prepare update data
    const updateData: any = {
      full_name: name,
      email: email,
      phone: phone,
      role: role,
      location: location,
      updated_at: new Date().toISOString(),
    }

    // If password change is requested, hash and update it
    if (changePassword && password && password.length >= 6) {
      const { data: passwordData, error: passwordError } = await supabase.rpc("reset_user_password", {
        p_username: email,
        p_new_password: password,
      })

      if (passwordError) {
        console.error("Error updating password:", passwordError)
        return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
      }
    }

    // Update user profile
    const { data, error } = await supabase.from("profiles").update(updateData).eq("id", userId).select()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: data[0],
    })
  } catch (error) {
    console.error("Error in update user API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
