import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    // Fetch requisitions for the current user
    const { data: requisitions, error } = await supabaseAdmin
      .from("it_equipment_requisitions")
      .select()
      .eq("requested_by_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching requisitions:", error)
      return NextResponse.json(
        { error: "Failed to fetch requisitions" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      requisitions: requisitions || [],
    })
  } catch (error) {
    console.error("[v0] API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
