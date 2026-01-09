import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export async function POST() {
  try {
    const supabase = createServerClient()

    // Default password for all approved users
    const DEFAULT_PASSWORD = "pa$$w0rd"

    // Hash the default password
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    // Get all users approved in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: recentUsers, error: fetchError } = await supabase
      .from("profiles")
      .select("id, username, email, full_name, role")
      .eq("status", "approved")
      .gte("updated_at", fiveMinutesAgo)

    if (fetchError) {
      console.error("Error fetching recent users:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!recentUsers || recentUsers.length === 0) {
      return NextResponse.json({
        message: "No users approved in the last 5 minutes",
        updated: 0,
      })
    }

    // Update each user's password
    const updatePromises = recentUsers.map(async (user) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          password_hash: hashedPassword,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        console.error(`Error updating password for ${user.username}:`, error)
        return { ...user, success: false, error: error.message }
      }

      return { ...user, success: true }
    })

    const results = await Promise.all(updatePromises)
    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      message: `Updated passwords for ${successCount} out of ${recentUsers.length} users`,
      updated: successCount,
      total: recentUsers.length,
      users: results.map((r) => ({
        username: r.username,
        email: r.email,
        role: r.role,
        success: r.success,
      })),
    })
  } catch (error) {
    console.error("Error resetting recent passwords:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to reset passwords",
      },
      { status: 500 },
    )
  }
}
