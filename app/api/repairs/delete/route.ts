import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { repairId, userId, userRole } = body

    console.log("[v0] Deleting repair:", repairId, "by:", userId, "role:", userRole)

    if (!repairId) {
      return NextResponse.json({ error: "Repair ID is required" }, { status: 400 })
    }

    // Fetch the repair to verify ownership and assignment status
    const { data: repair, error: fetchError } = await supabaseAdmin
      .from("repair_requests")
      .select("id, request_number, requested_by, assigned_to, status")
      .eq("id", repairId)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching repair:", fetchError)
      return NextResponse.json({ error: "Repair not found" }, { status: 404 })
    }

    // Authorization checks:
    // 1. Repair creator can delete if repair is unassigned (status: pending or rejected)
    // 2. Admin can always delete
    const isCreator = repair.requested_by?.toLowerCase() === userId?.toLowerCase()
    const canAlwaysDelete = userRole === "admin"
    const isUnassigned = !repair.assigned_to || repair.status === "pending" || repair.status === "rejected"

    if (!canAlwaysDelete && (!isCreator || !isUnassigned)) {
      console.error("[v0] Unauthorized delete attempt - not creator or repair is assigned")
      return NextResponse.json(
        { 
          error: "You can only delete your own unassigned repairs. Contact Admin to delete assigned repairs." 
        }, 
        { status: 403 }
      )
    }

    // Delete the repair
    const { data, error } = await supabaseAdmin
      .from("repair_requests")
      .delete()
      .eq("id", repairId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error deleting repair:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log the deletion
    await supabaseAdmin.from("audit_logs").insert({
      username: userId,
      action: "DELETE_REPAIR",
      resource: `repair_requests/${repairId}`,
      details: `Deleted repair request: ${repair.request_number || repairId}`,
      severity: "medium",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    console.log("[v0] Repair deleted successfully:", repairId)

    return NextResponse.json({ 
      success: true, 
      message: `Repair ${repair.request_number || repairId} has been deleted`
    })
  } catch (error) {
    console.error("[v0] API Repairs Delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
