"use server"

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get all knowledge base articles
    const { data: articles, error } = await supabase
      .from("knowledge_base_articles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error && error.code !== "42P01") { // Table doesn't exist
      console.error("[v0] Error fetching knowledge base articles:", error)
    }

    return NextResponse.json({
      success: true,
      articles: articles || [],
    })
  } catch (error) {
    console.error("[v0] Knowledge Base API error:", error)
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { title, content, category, author, is_published } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("knowledge_base_articles")
      .insert({
        title,
        content,
        category: category || "General",
        author: author || "Admin",
        is_published: is_published !== false,
        views: 0,
        helpful_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating article:", error)
      return NextResponse.json({ error: "Failed to create article" }, { status: 500 })
    }

    return NextResponse.json({ success: true, article: data })
  } catch (error) {
    console.error("[v0] Knowledge Base POST error:", error)
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Article ID is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("knowledge_base_articles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating article:", error)
      return NextResponse.json({ error: "Failed to update article" }, { status: 500 })
    }

    return NextResponse.json({ success: true, article: data })
  } catch (error) {
    console.error("[v0] Knowledge Base PATCH error:", error)
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Article ID is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("knowledge_base_articles")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[v0] Error deleting article:", error)
      return NextResponse.json({ error: "Failed to delete article" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Knowledge Base DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 })
  }
}
