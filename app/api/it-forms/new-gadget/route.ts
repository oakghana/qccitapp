import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "service-role-key-placeholder"
)

async function generateNextSequentialNumber() {
  const { data } = await supabaseAdmin
    .from("new_gadget_requests")
    .select("request_number")
    .order("created_at", { ascending: false })
    .limit(1)

  const previousNumber = data?.[0]?.request_number || "NG-0000"
  const lastSequence = Number(previousNumber.split("-").pop() || "0")
  return `NG-${String(lastSequence + 1).padStart(4, "0")}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      staffName,
      departmentName,
      complaintsFromUsers,
      requestDate,
      makeOfGadget,
      serialNumber,
      yearOfPurchase,
      otherComments,
      departmentalHeadName,
      departmentalHeadDate,
      recommended,
      confirmedBy,
      confirmedDate,
    } = body

    console.log("[new-gadget] Creating new gadget request:", {
      staffName,
      departmentName,
      makeOfGadget,
    })

    const requestNumber = await generateNextSequentialNumber()

    const insertData = {
      request_number: requestNumber,
      staff_name: staffName,
      department_name: departmentName,
      complaints_from_users: complaintsFromUsers,
      request_date: requestDate || new Date().toISOString().split("T")[0],
      gadget_make: makeOfGadget || null,
      serial_number: serialNumber || null,
      year_of_purchase: yearOfPurchase ? parseInt(yearOfPurchase) : null,
      other_comments: otherComments || null,
      departmental_head_name: departmentalHeadName || null,
      departmental_head_date: departmentalHeadDate || null,
      recommended: recommended === "yes" ? true : recommended === "no" ? false : null,
      confirmed_by: confirmedBy || null,
      confirmed_date: confirmedDate || null,
      status: "pending_department_head",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error: insertError } = await supabaseAdmin
      .from("new_gadget_requests")
      .insert([insertData])
      .select()

    if (insertError) {
      console.error("[new-gadget] Error creating request:", insertError)
      return NextResponse.json(
        { error: insertError.message || "Failed to create gadget request" },
        { status: 500 }
      )
    }

    console.log("[new-gadget] Request created successfully:", data)

    return NextResponse.json({
      success: true,
      message: "New gadget request created successfully",
      request: data?.[0],
      requestNumber
    })

  } catch (error: any) {
    console.error("[new-gadget] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const department = searchParams.get("department")
    const staffName = searchParams.get("staffName")

    console.log("[new-gadget] Loading gadget requests:", { status, department })

    let query = supabaseAdmin
      .from("new_gadget_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (department && department !== "all") {
      query = query.eq("department_name", department)
    }

    if (staffName) {
      query = query.eq("staff_name", staffName)
    }

    const { data, error } = await query

    if (error) {
      console.error("[new-gadget] Error loading requests:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      requests: data || []
    })

  } catch (error: any) {
    console.error("[new-gadget] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const body = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Request id is required" }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from("new_gadget_requests")
      .select("id,status")
      .eq("id", id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (!["draft", "pending_department_head"].includes(existing.status)) {
      return NextResponse.json({ error: "This request is already under review and cannot be edited." }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from("new_gadget_requests")
      .update({
        complaints_from_users: body.items_required,
        other_comments: body.purpose,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message || "Failed to update request" }, { status: 500 })
    }

    return NextResponse.json({ success: true, requisition: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
