import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH - Update a stock assignment
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

    console.log("[v0] Updating stock assignment:", assignmentId, body)

    // Validate required fields
    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID is required" }, { status: 400 })
    }

    if (!assigned_to?.trim()) {
      return NextResponse.json({ error: "Recipient name is required" }, { status: 400 })
    }

    // Only admin, it_store_head, regional_it_head can edit assignments
    if (!["admin", "it_store_head", "regional_it_head"].includes(userRole)) {
      return NextResponse.json(
        { error: "You don't have permission to edit assignments" },
        { status: 403 }
      )
    }

    // Get the existing assignment
    const { data: existingAssignment, error: fetchError } = await supabaseAdmin
      .from("stock_assignments")
      .select("*")
      .eq("id", assignmentId)
      .single()

    if (fetchError || !existingAssignment) {
      console.error("[v0] Assignment not found:", fetchError)
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 })
    }

    // Store old values for audit
    const oldAssignedTo = existingAssignment.assigned_to
    const wasHardware = existingAssignment.is_hardware

    // Update the assignment
    const { data: updatedAssignment, error: updateError } = await supabaseAdmin
      .from("stock_assignments")
      .update({
        assigned_to: assigned_to.trim(),
        assigned_to_email: assigned_to_email?.trim() || null,
        department: department?.trim() || existingAssignment.department,
        office_location: office_location?.trim() || existingAssignment.office_location,
        room_number: room_number?.trim() || null,
        notes: notes?.trim() || existingAssignment.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Error updating assignment:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // If this was a hardware assignment, update the device records as well
    if (wasHardware) {
      // Find devices linked to this assignment
      const { data: devices } = await supabaseAdmin
        .from("devices")
        .select("id")
        .eq("notes", `%${existingAssignment.id}%`)

      // Also try to find by the item name and old assigned_to
      const { data: devicesByItem } = await supabaseAdmin
        .from("devices")
        .select("id, assigned_to, notes")
        .ilike("model", `%${existingAssignment.item_name}%`)
        .eq("assigned_to", oldAssignedTo)

      const devicesToUpdate = [
        ...(devices || []),
        ...(devicesByItem || [])
      ]

      if (devicesToUpdate.length > 0) {
        const deviceIds = [...new Set(devicesToUpdate.map(d => d.id))]
        
        const { error: deviceUpdateError } = await supabaseAdmin
          .from("devices")
          .update({
            assigned_to: assigned_to.trim(),
            office_location: department?.trim() || office_location?.trim(),
            room_number: room_number?.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .in("id", deviceIds)

        if (deviceUpdateError) {
          console.error("[v0] Error updating devices:", deviceUpdateError)
          // Don't fail the whole operation, just log
        } else {
          console.log(`[v0] Updated ${deviceIds.length} device(s) for assignment ${assignmentId}`)
        }
      }
    }

    // Record the edit in stock_transactions for audit trail
    await supabaseAdmin.from("stock_transactions").insert({
      item_id: existingAssignment.item_id,
      item_name: existingAssignment.item_name,
      transaction_type: "assignment_edit",
      quantity: 0, // No quantity change
      unit: "pieces",
      location_name: existingAssignment.location,
      recipient: assigned_to.trim(),
      office_location: department?.trim() || office_location?.trim(),
      room_number: room_number?.trim(),
      reference_type: "assignment_edit",
      reference_id: assignmentId,
      notes: `Assignment updated. Previous: ${oldAssignedTo} → New: ${assigned_to}. Updated by: ${updatedBy}`,
      performed_by: updatedBy,
      created_at: new Date().toISOString(),
    })

    console.log("[v0] Assignment updated successfully:", updatedAssignment)

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
      message: `Assignment updated successfully${wasHardware ? ". Device records also updated." : ""}`,
    })
  } catch (error) {
    console.error("[v0] Error in assignment update:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
