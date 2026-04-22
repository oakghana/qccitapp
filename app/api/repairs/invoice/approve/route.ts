import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoiceId, action, approvalNotes, approvedBy, approvedByName, userRole } = body

    if (!invoiceId || !action || !userRole) {
      return NextResponse.json(
        { error: "Missing required fields: invoiceId, action, or userRole" },
        { status: 400 }
      )
    }

    // Only admin and it_head can approve/reject invoices
    if (userRole !== "admin" && userRole !== "it_head") {
      console.error("[v0] Unauthorized invoice approval attempt - role:", userRole)
      return NextResponse.json(
        { error: "Unauthorized: Only Admin and IT Head can approve invoices" },
        { status: 403 }
      )
    }

    console.log("[v0] Invoice action:", action, "on invoice:", invoiceId, "by:", approvedByName)

    if (action === "approve") {
      // Approve invoice
      const { data: invoice, error: fetchError } = await supabaseAdmin
        .from("repair_invoices")
        .select("*")
        .eq("id", invoiceId)
        .single()

      if (fetchError) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
      }

      const { data, error } = await supabaseAdmin
        .from("repair_invoices")
        .update({
          status: "approved",
          approved_by: approvedBy,
          approved_by_name: approvedByName,
          approval_notes: approvalNotes || null,
          approved_at: new Date().toISOString(),
        })
        .eq("id", invoiceId)
        .select()
        .single()

      if (error) {
        console.error("[v0] Error approving invoice:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Update repair_requests to mark invoice as approved
      const { error: updateError } = await supabaseAdmin
        .from("repair_requests")
        .update({
          invoice_approved: true,
        })
        .eq("invoice_id", invoiceId)

      if (updateError) {
        console.warn("[v0] Warning: Could not update repair invoice approval status:", updateError)
      }

      console.log("[v0] Invoice approved successfully:", invoiceId)

      return NextResponse.json({
        message: "Invoice approved successfully",
        invoice: data,
      })
    } else if (action === "reject") {
      // Reject invoice
      const { data, error } = await supabaseAdmin
        .from("repair_invoices")
        .update({
          status: "rejected",
          approval_notes: approvalNotes || "Rejected by IT staff",
          approved_by: approvedBy,
          approved_by_name: approvedByName,
          approved_at: new Date().toISOString(),
        })
        .eq("id", invoiceId)
        .select()
        .single()

      if (error) {
        console.error("[v0] Error rejecting invoice:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log("[v0] Invoice rejected successfully:", invoiceId)

      return NextResponse.json({
        message: "Invoice rejected successfully",
        invoice: data,
      })
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'approve' or 'reject'" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("[v0] API Invoice Approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"
    const userRole = searchParams.get("userRole")

    console.log("[v0] Fetching invoices with status:", status, "userRole:", userRole)

    // Only admin and it_head can view all invoices
    if (userRole !== "admin" && userRole !== "it_head") {
      return NextResponse.json(
        { error: "Unauthorized: Only Admin and IT Head can view invoices" },
        { status: 403 }
      )
    }

    let query = supabaseAdmin
      .from("repair_invoices")
      .select(
        `
        *,
        repair_id:repair_requests(
          id,
          task_number,
          issue_description,
          status
        )
      `
      )
      .order("created_at", { ascending: false })

    if (status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching invoices:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      invoices: data || [],
      message: `Loaded ${data?.length || 0} invoices`,
    })
  } catch (error) {
    console.error("[v0] API Invoice GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
