import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, role, password } = body

    if (!userId || !role) {
      return NextResponse.json({ message: "Missing userId or role" }, { status: 400 })
    }

    const supabase = await createClient()

    const updateData: any = {
      status: "approved",
      role,
      updated_at: new Date().toISOString(),
    }

    // If password is provided, hash it and update
    if (password && password.trim()) {
      const bcrypt = require("bcrypt")
      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.password_hash = hashedPassword
    }

    const { data, error } = await supabase.from("profiles").update(updateData).eq("id", userId).select().single()

    if (error) {
      console.error("Approval error:", error)
      return NextResponse.json({ message: "Failed to approve user" }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: "User approved successfully",
        user: data,
        passwordChanged: !!password,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Approval error:", error)
    return NextResponse.json({ message: "An error occurred during approval" }, { status: 500 })
  }
}
