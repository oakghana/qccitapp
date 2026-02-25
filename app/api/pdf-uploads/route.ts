import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { put } from "@vercel/blob"
import { logDocumentAudit } from "@/lib/audit-logging"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get("type")
    const location = searchParams.get("location")
    const userRole = searchParams.get("userRole")
    const userLocation = searchParams.get("userLocation")
    const userId = searchParams.get("userId")

    console.log("[v0] PDF Uploads GET - type:", documentType, "location:", location, "userRole:", userRole, "userLocation:", userLocation, "userId:", userId)

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

    // Apply location-based access control
    if (userRole === "it_staff" || userRole === "regional_it_head" || userRole === "it_head") {
      // IT Staff, Regional IT Head, and IT Head see ALL documents - NO RESTRICTIONS
      console.log("[v0] IT Staff / Regional IT Head / IT Head - showing all active documents without restrictions")
      query = query  // No additional filters - show all active documents
    } else if (location && location !== "all") {
      // Fallback for other roles with explicit location filter
      console.log("[v0] Filtering by location:", location)
      const [docsForLocation, docsForAll] = await Promise.all([
        supabase
          .from("pdf_uploads")
          .select(`*,confirmations:pdf_confirmations(id,user_id,user_name,user_location,confirmed_at,comments)`)
          .eq("is_active", true)
          .eq("target_location", location)
          .order("created_at", { ascending: false }),
        supabase
          .from("pdf_uploads")
          .select(`*,confirmations:pdf_confirmations(id,user_id,user_name,user_location,confirmed_at,comments)`)
          .eq("is_active", true)
          .is("target_location", null)
          .order("created_at", { ascending: false })
      ])
      
      const combinedData = [
        ...(docsForLocation.data || []),
        ...(docsForAll.data || [])
      ]
      const uniqueData = Array.from(new Map(combinedData.map(item => [item.id, item])).values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      return NextResponse.json({ success: true, uploads: uniqueData })
    } else {
      // Default: show only documents for all locations if no role-based filter applies
      console.log("[v0] Default filter - showing only documents for all locations")
      query = query.is("target_location", null)
    }

    const { data, error } = await query

    console.log("[v0] PDF Uploads query result - count:", data?.length, "error:", error?.message)
    
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

    // Create database record
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
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating PDF upload record:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log audit trail for document upload
    await logDocumentAudit({
      document_id: data.id,
      action: "document_uploaded",
      user_id: uploadedBy,
      user_name: uploadedByName,
      details: {
        title,
        document_type: documentType,
        file_name: file.name,
        file_size: file.size,
        target_location: targetLocation,
      },
    })

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
    const userId = searchParams.get("userId")
    const userName = searchParams.get("userName")

    if (!id) {
      return NextResponse.json({ error: "Missing upload ID" }, { status: 400 })
    }

    // Get the document details before deletion
    const { data: documentData, error: fetchError } = await supabase
      .from("pdf_uploads")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching document for audit:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Soft delete - just mark as inactive
    const { error } = await supabase
      .from("pdf_uploads")
      .update({ is_active: false, deleted_at: new Date().toISOString(), deleted_by: userId })
      .eq("id", id)

    if (error) {
      console.error("Error deleting PDF upload:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log audit trail for document deletion
    if (userId && userName) {
      await logDocumentAudit({
        document_id: id,
        action: "document_deleted",
        user_id: userId,
        user_name: userName,
        details: {
          title: documentData.title,
          document_type: documentData.document_type,
          file_name: documentData.file_name,
          uploaded_by: documentData.uploaded_by,
          uploaded_by_name: documentData.uploaded_by_name,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/pdf-uploads:", error)
    return NextResponse.json({ error: "Failed to delete PDF upload" }, { status: 500 })
  }
}
