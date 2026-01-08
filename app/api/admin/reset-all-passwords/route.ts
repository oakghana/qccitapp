import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { adminPassword } = await request.json()

    // Security check - require admin authentication
    if (adminPassword !== "admin@qcc2025") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createClient()

    // Get all approved users
    const { data: users, error: fetchError } = await supabase
      .from("profiles")
      .select("id, username, email")
      .eq("status", "approved")

    if (fetchError) {
      console.error("[v0] Error fetching users:", fetchError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Hash the default password
    const defaultPassword = "qcc@123"
    const hashedPassword = await bcrypt.hash(defaultPassword, 10)

    // Update all users with the hashed password
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("status", "approved")

    if (updateError) {
      console.error("[v0] Error updating passwords:", updateError)
      return NextResponse.json({ error: "Failed to reset passwords" }, { status: 500 })
    }

    console.log(`[v0] Successfully reset passwords for ${users?.length || 0} users`)

    return NextResponse.json({
      success: true,
      message: `Reset passwords for ${users?.length || 0} users to default (qcc@123)`,
      users: users?.map((u) => u.username),
    })
  } catch (error: any) {
    console.error("[v0] Error in reset-all-passwords API:", error)
    return NextResponse.json({ error: error.message || "Failed to reset passwords" }, { status: 500 })
  }
}
