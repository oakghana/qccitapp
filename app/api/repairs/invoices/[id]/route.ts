import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, reviewed_by, reviewed_by_name, review_notes } = body

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
    }

    console.log("[v0] Updating repair invoice:", id, { status, reviewed_by, reviewed_by_name })

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updateData.status = status
    }

    if (reviewed_by) {
      updateData.reviewed_by = reviewed_by
    }

    if (reviewed_by_name) {
      updateData.reviewed_by_name = reviewed_by_name
    }

    if (review_notes !== undefined) {
      updateData.review_notes = review_notes
    }

    if (status === "approved" || status === "rejected") {
      updateData.reviewed_at = new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from("repair_invoices")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating repair invoice:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Updated repair invoice:", data)

    return NextResponse.json({ success: true, invoice: data })
  } catch (error) {
    console.error("[v0] API Repair Invoice Update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}