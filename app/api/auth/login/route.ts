import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

// Use service role key to bypass RLS
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    console.log("[v0] Login attempt for:", username)

    const { data: user, error: queryError } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .eq("status", "approved")
      .eq("is_active", true)
      .maybeSingle()

    if (queryError) {
      console.error("[v0] Database query error:", queryError)
      return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
    }

    if (!user) {
      console.log("[v0] No user found for username:", username)
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    console.log("[v0] User found:", user.username, "role:", user.role)
    console.log("[v0] Hash exists:", !!user.password_hash)

    if (!user.password_hash || user.password_hash.length < 20) {
      console.log("[v0] No valid password hash for user:", username)
      return NextResponse.json(
        {
          error: "Password not set. Please contact an administrator.",
        },
        { status: 401 },
      )
    }

    // Reject old pgcrypto hashes ($2a$06$) - users must reset their passwords
    if (user.password_hash.startsWith("$2a$06$")) {
      console.log("[v0] User has old pgcrypto hash, must reset password:", username)
      return NextResponse.json(
        {
          error: "Password format outdated. Please contact an administrator to reset your password.",
        },
        { status: 401 },
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    console.log("[v0] Password verification result:", isPasswordValid)

    if (!isPasswordValid) {
      console.log("[v0] Password verification failed for:", username)
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    let redirectUrl = "/dashboard"
    if (user.role === "admin") {
      redirectUrl = "/dashboard/admin"
    } else if (user.role === "it_store_head") {
      redirectUrl = "/dashboard/store-inventory"
    } else if (user.role === "it_staff") {
      redirectUrl = "/dashboard/assigned-tasks"
    } else if (user.role === "staff") {
      redirectUrl = "/dashboard/service-desk"
    } else if (user.role === "regional_it_head" || user.role === "it_head") {
      redirectUrl = "/dashboard"
    } else if (user.role?.startsWith("service_desk_")) {
      redirectUrl = "/dashboard/service-desk"
    }

    console.log("[v0] Login successful for:", username, "redirecting to:", redirectUrl)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        location: user.location,
        department: user.department,
      },
      redirectUrl,
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}
