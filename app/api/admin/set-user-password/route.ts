import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient((process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"), (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key"), {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    // Hash password with bcryptjs
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log("[v0] Setting password for:", username)
    console.log("[v0] New hash preview:", hashedPassword.substring(0, 20))

    // Update user password
    const { data, error } = await supabase
      .from("profiles")
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("username", username)
      .select("username, email, role, status")
      .single()

    if (error) {
      console.error("[v0] Error updating password:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Password updated for ${username}`,
      user: data,
    })
  } catch (error: any) {
    console.error("[v0] Password update error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
