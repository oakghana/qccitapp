import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get("type")
    const location = searchParams.get("location")

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
      query = query.or(`target_location.eq.${location},target_location.is.null`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching PDF uploads:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, uploads: data })
  } catch (error) {
    console.error("Error in GET /api/pdf-uploads:", error)
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

    // Upload file to Supabase Storage
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`
    const fileBuffer = await file.arrayBuffer()
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("pdf-documents")
      .upload(fileName, fileBuffer, {
        contentType: "application/pdf",
        cacheControl: "3600",
      })

    if (uploadError) {
      console.error("Error uploading file:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("pdf-documents")
      .getPublicUrl(fileName)

    // Create database record
    const { data, error } = await supabase
      .from("pdf_uploads")
      .insert({
        title,
        description,
        document_type: documentType,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        uploaded_by: uploadedBy,
        uploaded_by_name: uploadedByName,
        target_location: targetLocation === "all" ? null : targetLocation,
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
