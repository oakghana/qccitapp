import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const TABLE_MAP: Record<string, string> = {
  locations: "lookup_locations",
  departments: "lookup_departments",
  device_types: "lookup_device_types",
  item_categories: "lookup_item_categories",
  regions: "regions",
  districts: "districts",
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")

    if (!type || !TABLE_MAP[type]) {
      return NextResponse.json({ error: "Invalid lookup type" }, { status: 400 })
    }

    const { data, error } = await supabase.from(TABLE_MAP[type]).select("*").order("name", { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const body = await request.json()

    if (!type || !TABLE_MAP[type]) {
      return NextResponse.json({ error: "Invalid lookup type" }, { status: 400 })
    }

    const { data, error } = await supabase.from(TABLE_MAP[type]).insert([body]).select().single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const id = searchParams.get("id")
    const body = await request.json()

    if (!type || !TABLE_MAP[type] || !id) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const { data, error } = await supabase.from(TABLE_MAP[type]).update(body).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type")
    const id = searchParams.get("id")

    if (!type || !TABLE_MAP[type] || !id) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const { error } = await supabase.from(TABLE_MAP[type]).delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
