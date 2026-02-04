import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { put } from "@vercel/blob"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get("type")
    const location = searchParams.get("location")

    console.log("[v0] PDF Uploads GET - type:", documentType, "location:", location)

    let query = supabase
      .from("pdf_uploads")
      .select(`
        *,
        confirmations:pdf_confirmations(
          id,
          user_id,
          user_name,
          user_location,
          confirmed_at,
          comments
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (documentType && documentType !== "all") {
      query = query.eq("document_type", documentType)
    }

    if (location && location !== "all") {
      console.log("[v0] Filtering by location:", location)
      query = query.or(`target_location.eq.${location},target_location.is.null`)
    }

    const { data, error } = await query

    console.log("[v0] PDF Uploads query result - count:", data?.length, "error:", error)
    
    if (error) {
      console.error("[v0] Error fetching PDF uploads:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, uploads: data })
  } catch (error) {
    console.error("[v0] Error in GET /api/pdf-uploads:", error)
    return NextResponse.json({ error: "Failed to fetch PDF uploads" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const documentType = formData.get("documentType") as string
    const targetLocation = formData.get("targetLocation") as string
    const uploadedBy = formData.get("uploadedBy") as string
    const uploadedByName = formData.get("uploadedByName") as string

    if (!file || !title || !documentType || !uploadedBy || !uploadedByName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Upload file to Vercel Blob
    const fileName = `pdf-documents/${Date.now()}_${file.name.replace(/\s+/g, "_")}`
    const fileBuffer = await file.arrayBuffer()

    const { url } = await put(fileName, fileBuffer, {
      access: "public",
      contentType: "application/pdf",
    })

    console.log("[v0] File uploaded to Vercel Blob successfully:", url)

    // Create database record - new uploads are not confirmed until admin approves
    const { data, error } = await supabase
      .from("pdf_uploads")
      .insert({
        title,
        description,
        document_type: documentType,
        file_name: file.name,
        file_url: url,
        file_size: file.size,
        uploaded_by: uploadedBy,
        uploaded_by_name: uploadedByName,
        target_location: targetLocation === "all" ? null : targetLocation,
        is_confirmed: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating PDF upload record:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, upload: data })
  } catch (error) {
    console.error("Error in POST /api/pdf-uploads:", error)
    return NextResponse.json({ error: "Failed to create PDF upload" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing upload ID" }, { status: 400 })
    }

    // Soft delete - just mark as inactive
    const { error } = await supabase
      .from("pdf_uploads")
      .update({ is_active: false })
      .eq("id", id)

    if (error) {
      console.error("Error deleting PDF upload:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/pdf-uploads:", error)
    return NextResponse.json({ error: "Failed to delete PDF upload" }, { status: 500 })
  }
}
