import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { logDocumentAudit } from "@/lib/audit-logging"

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function POST(request: Request) {
  try {
    const { documentId, userId, userName } = await request.json()

    if (!documentId || !userId || !userName) {
      return NextResponse.json(
        { error: "Missing required fields: documentId, userId, userName" },
        { status: 400 }
      )
    }

    // Get the document details before restoration
    const { data: documentData, error: fetchError } = await supabase
      .from("pdf_uploads")
      .select("*")
      .eq("id", documentId)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching document for restoration:", fetchError)
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      )
    }

    if (!documentData) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      )
    }

    // Restore the document (mark as active again)
    const { error: updateError } = await supabase
      .from("pdf_uploads")
      .update({
        is_active: true,
        deleted_at: null,
        deleted_by: null,
      })
      .eq("id", documentId)

    if (updateError) {
      console.error("[v0] Error restoring document:", updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // Log audit trail for document restoration
    await logDocumentAudit({
      document_id: documentId,
      action: "document_restored",
      user_id: userId,
      user_name: userName,
      details: {
        title: documentData.title,
        document_type: documentData.document_type,
        file_name: documentData.file_name,
        original_uploader: documentData.uploaded_by_name,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Document restored successfully",
      document: {
        id: documentId,
        title: documentData.title,
      },
    })
  } catch (error) {
    console.error("[v0] Error in POST /api/pdf-uploads/restore:", error)
    return NextResponse.json(
      { error: "Failed to restore document" },
      { status: 500 }
    )
  }
}
