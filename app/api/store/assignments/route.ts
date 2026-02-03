import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get("location") || ""
    const canSeeAll = searchParams.get("canSeeAll") === "true"
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const department = searchParams.get("department")
    const assignedTo = searchParams.get("assignedTo")

    console.log("[assignments] Loading assignments:", { location, canSeeAll, startDate, endDate })

    let query = supabaseAdmin
      .from("stock_assignments")
      .select("*")
      .order("created_at", { ascending: false })

    // Filter by location if user cannot see all
    if (!canSeeAll && location) {
      query = query.eq("location", location)
    }

    // Apply date filters
    if (startDate) {
      query = query.gte("created_at", startDate)
    }
    if (endDate) {
      query = query.lte("created_at", endDate)
    }

    // Apply department filter
    if (department && department !== "all") {
      query = query.eq("department", department)
    }

    // Apply assigned_to filter
    if (assignedTo) {
      query = query.ilike("assigned_to", `%${assignedTo}%`)
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error("[assignments] Error fetching assignments:", error)
      return NextResponse.json(
        { error: "Failed to load assignments" },
        { status: 500 }
      )
    }

    console.log(`[assignments] Loaded ${assignments?.length || 0} assignments`)

    return NextResponse.json({
      success: true,
      assignments: assignments || [],
      count: assignments?.length || 0,
    })
  } catch (error: any) {
    console.error("[assignments] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET assignment by ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { assignmentId } = body

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      )
    }

    const { data: assignment, error } = await supabaseAdmin
      .from("stock_assignments")
      .select("*")
      .eq("id", assignmentId)
      .single()

    if (error) {
      console.error("[assignments] Error fetching assignment:", error)
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      assignment,
    })
  } catch (error: any) {
    console.error("[assignments] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Update assignment status (return, transfer, etc.)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { assignmentId, action, notes, updatedBy } = body

    if (!assignmentId || !action) {
      return NextResponse.json(
        { error: "Assignment ID and action are required" },
        { status: 400 }
      )
    }

    // Get current assignment
    const { data: assignment, error: fetchError } = await supabaseAdmin
      .from("stock_assignments")
      .select("*")
      .eq("id", assignmentId)
      .single()

    if (fetchError || !assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      )
    }

    let newStatus = assignment.status
    let updateData: any = {
      updated_at: new Date().toISOString(),
    }

    switch (action) {
      case "return":
        newStatus = "returned"
        updateData.return_date = new Date().toISOString()
        updateData.return_notes = notes
        
        // Return stock to inventory
        await supabaseAdmin
          .from("store_items")
          .update({
            quantity: supabaseAdmin.rpc("increment_quantity", {
              row_id: assignment.item_id,
              amount: assignment.quantity,
            }),
          })
          .eq("id", assignment.item_id)
        break

      case "transfer":
        newStatus = "transferred"
        updateData.transfer_notes = notes
        break

      case "damaged":
        newStatus = "damaged"
        updateData.damage_notes = notes
        break

      case "lost":
        newStatus = "lost"
        updateData.lost_notes = notes
        break

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    updateData.status = newStatus

    const { error: updateError } = await supabaseAdmin
      .from("stock_assignments")
      .update(updateData)
      .eq("id", assignmentId)

    if (updateError) {
      console.error("[assignments] Error updating assignment:", updateError)
      return NextResponse.json(
        { error: "Failed to update assignment" },
        { status: 500 }
      )
    }

    // Log the transaction
    await supabaseAdmin.from("stock_transactions").insert({
      item_id: assignment.item_id,
      item_name: assignment.item_name,
      transaction_type: action,
      quantity: assignment.quantity,
      location_name: assignment.location,
      recipient: assignment.assigned_to,
      reference_type: "assignment",
      reference_id: assignmentId,
      notes: notes || `Assignment ${action}`,
      performed_by: updatedBy,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `Assignment ${action} successful`,
    })
  } catch (error: any) {
    console.error("[assignments] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
