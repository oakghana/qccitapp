import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient()

    // Fetch all categories
    const { data: categories, error } = await supabaseAdmin
      .from("store_categories")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching categories:", error)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      categories: categories || [],
    })
  } catch (error: any) {
    console.error("[v0] Error in get-categories route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, createdBy } = body

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Check if category already exists
    const { data: existing } = await supabaseAdmin
      .from("store_categories")
      .select("*")
      .ilike("name", name)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 })
    }

    // Create new category
    const { data: category, error } = await supabaseAdmin
      .from("store_categories")
      .insert({
        name: name.trim(),
        description: description || null,
        created_by: createdBy,
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("[v0] Error creating category:", error)
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
    }

    console.log("[v0] Category created successfully:", category[0].id)

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      category: category[0],
    })
  } catch (error: any) {
    console.error("[v0] Error in create-category route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
