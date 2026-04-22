import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient((process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"), (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key"))

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting password reset for all approved users")

    // Generate bcryptjs hash for 'qcc@123'
    const password = "qcc@123"
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    console.log("[v0] Generated bcryptjs hash")

    // Test the hash immediately
    const testValid = await bcrypt.compare(password, passwordHash)
    console.log("[v0] Hash validation test:", testValid)

    if (!testValid) {
      return NextResponse.json({ error: "Generated hash failed validation" }, { status: 500 })
    }

    // Get all approved users
    const { data: users, error: fetchError } = await supabase
      .from("profiles")
      .select("id, username, email")
      .eq("status", "approved")

    if (fetchError) {
      console.error("[v0] Error fetching users:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    console.log("[v0] Found", users?.length, "approved users to update")

    // Update all users with the new hash
    const { data: updateData, error: updateError } = await supabase
      .from("profiles")
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("status", "approved")
      .select("username")

    if (updateError) {
      console.error("[v0] Error updating passwords:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log("[v0] Successfully updated", updateData?.length, "user passwords")

    return NextResponse.json({
      success: true,
      message: `Reset ${updateData?.length} user passwords to qcc@123`,
      users: updateData?.map((u) => u.username),
      hash: passwordHash.substring(0, 20) + "...", // Show partial hash for verification
    })
  } catch (error: any) {
    console.error("[v0] Password reset error:", error)
    return NextResponse.json({ error: error.message || "Failed to reset passwords" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
