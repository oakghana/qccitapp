import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Normalize category name to title case format (server-side version)
 */
function normalizeCategoryName(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return ""
  
  try {
    return name
      .toLowerCase()
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  } catch (error) {
    console.warn("[v0] Error normalizing category name:", error, name)
    return String(name)
  }
}

export async function GET() {
  try {
    const supabaseAdmin = createAdminClient()

    // Fetch all categories and return normalized (title-cased)
    const { data: categories, error } = await supabaseAdmin
      .from("store_categories")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching categories:", error)
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
    }

    // Normalize category names to title case for consistency
    const normalizedCategories = (categories || []).map(cat => ({
      ...cat,
      name: normalizeCategoryName(cat.name)
    }))

    return NextResponse.json({
      success: true,
      categories: normalizedCategories,
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
    
    // Normalize category name
    const normalizedName = normalizeCategoryName(name)

    // Check if category already exists (case-insensitive)
    const { data: existing } = await supabaseAdmin
      .from("store_categories")
      .select("*")
      .ilike("name", normalizedName)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 })
    }

    // Create new category with normalized name
    const { data: category, error } = await supabaseAdmin
      .from("store_categories")
      .insert({
        name: normalizedName,
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

// Utility function to normalize category names to title case
function normalizeCategoryName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
