import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Call the simulation endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("supabase.co", "vercel.app") || "http://localhost:3000"}/api/admin/simulate-login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("session", data.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({
      success: true,
      user: data.user,
      redirect: "/dashboard",
    })
  } catch (error) {
    console.error("[v0] Test login error:", error)
    return NextResponse.json(
      {
        error: "Login failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
