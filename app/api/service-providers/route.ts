import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get("is_active") === "true"

    console.log("[v0] Fetching service providers - is_active:", isActive)

    let query = supabase.from("service_providers").select("*")

    if (isActive) {
      query = query.eq("is_active", true)
    }

    query = query.order("name")

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching service providers:", error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    console.log("[v0] Service providers fetched:", data?.length)

    return NextResponse.json({
      providers: data || [],
      count: data?.length || 0,
    })
  } catch (error: any) {
    console.error("[v0] Error in service providers API:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
