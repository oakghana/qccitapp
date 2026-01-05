import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json({ message: "Missing userId or role" }, { status: 400 })
    }

    const supabase = await createClient()

    // Update user status and assign role
    const { data, error } = await supabase
      .from("profiles")
      .update({
        status: "approved",
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Approval error:", error)
      return NextResponse.json({ message: "Failed to approve user" }, { status: 500 })
    }

    // TODO: Send notification email to user
    // You can add email notification logic here

    return NextResponse.json(
      {
        message: "User approved successfully",
        user: data,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Approval error:", error)
    return NextResponse.json({ message: "An error occurred during approval" }, { status: 500 })
  }
}
