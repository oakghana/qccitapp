import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ message: "Missing userId" }, { status: 400 })
    }

    const supabase = await createClient()

    // Update user status to rejected
    const { data, error } = await supabase
      .from("profiles")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Rejection error:", error)
      return NextResponse.json({ message: "Failed to reject user" }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: "User rejected successfully",
        user: data,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Rejection error:", error)
    return NextResponse.json({ message: "An error occurred during rejection" }, { status: 500 })
  }
}
