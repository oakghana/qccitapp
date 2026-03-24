import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_ROLES = ["admin", "it_store_head", "it_head", "regional_it_head"]

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      assignmentId,
      assigned_to,
      assigned_to_email,
      department,
      office_location,
      room_number,
      notes,
      updatedBy,
      userRole,
    } = body

    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { error: "You do not have permission to edit assignments" },
        { status: 403 }
      )
    }

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
    }

    if (!assigned_to?.trim()) {
      return NextResponse.json({ error: "Recipient name is required" }, { status: 400 })
    }

    // Fetch existing assignment for audit trail and hardware check
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("stock_assignments")
      .select("*")
      .eq("id", assignmentId)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Update the assignment record
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("stock_assignments")
      .update({
        assigned_to: assigned_to.trim(),
        assigned_to_email: assigned_to_email?.trim() || null,
        department: department?.trim() || existing.department,
        office_location: office_location?.trim() || existing.office_location,
        room_number: room_number?.trim() || null,
        notes: notes?.trim() || existing.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If hardware, update the linked device record via device_id
    if (existing.is_hardware && existing.device_id) {
      await supabaseAdmin
        .from("devices")
        .update({
          assigned_to: assigned_to.trim(),
          room_number: room_number?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.device_id)
      // Non-fatal: continue even if device update fails
    }

    // Write an audit log entry
    await supabaseAdmin.from("stock_audit_log").insert({
      item_id: existing.item_id,
      action: "assignment_edited",
      updated_by: updatedBy || "unknown",
      reason: `Edited by ${updatedBy} (${userRole})`,
      changes: {
        assignment_id: assignmentId,
        before: {
          assigned_to: existing.assigned_to,
          assigned_to_email: existing.assigned_to_email,
          department: existing.department,
          office_location: existing.office_location,
          room_number: existing.room_number,
          notes: existing.notes,
        },
        after: {
          assigned_to: assigned_to.trim(),
          assigned_to_email: assigned_to_email?.trim() || null,
          department: department?.trim() || null,
          office_location: office_location?.trim() || null,
          room_number: room_number?.trim() || null,
          notes: notes?.trim() || null,
        },
      },
    })

    return NextResponse.json({
      success: true,
      assignment: updated,
      message: `Assignment updated successfully${existing.is_hardware ? ". Device record also updated." : ""}`,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
