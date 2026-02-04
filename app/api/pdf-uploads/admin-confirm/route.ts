import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pdfId, adminId, adminName } = body

    if (!pdfId || !adminId || !adminName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    console.log("[v0] Admin confirming upload:", pdfId, "by", adminName)

    // Update the pdf_uploads table to set is_confirmed to true
    const { data, error } = await supabase
      .from("pdf_uploads")
      .update({
        is_confirmed: true,
        confirmed_at: new Date().toISOString(),
        confirmed_by: adminId,
        confirmed_by_name: adminName,
      })
      .eq("id", pdfId)
      .select()

    if (error) {
      console.error("[v0] Error confirming upload:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Upload confirmed successfully:", pdfId)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error in POST /api/pdf-uploads/admin-confirm:", error)
    return NextResponse.json({ error: "Failed to confirm upload" }, { status: 500 })
  }
}
