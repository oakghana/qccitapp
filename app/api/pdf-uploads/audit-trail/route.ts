import { NextResponse } from "next/server"
import { getDocumentAuditTrail } from "@/lib/audit-logging"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("documentId")

    if (!documentId) {
      return NextResponse.json(
        { error: "Missing documentId parameter" },
        { status: 400 }
      )
    }

    const auditTrail = await getDocumentAuditTrail(documentId)

    if (!auditTrail) {
      return NextResponse.json(
        { error: "Failed to fetch audit trail" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      auditTrail,
      documentId,
    })
  } catch (error) {
    console.error("[v0] Error in GET /api/pdf-uploads/audit-trail:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit trail" },
      { status: 500 }
    )
  }
}
