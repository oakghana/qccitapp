import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      itemSN,
      supplierName,
      itemsRequired,
      purpose,
      requestedBy,
      department,
      requestDate,
    } = body

    console.log("[it-requisitions] Creating new IT equipment requisition:", {
      itemSN,
      supplierName,
      department,
      requestedBy,
    })

    // Generate requisition number
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
    const requisitionNumber = `IT-REQ-${dateStr}-${randomNum}`

    const insertData = {
      requisition_number: requisitionNumber,
      item_sn: itemSN,
      supplier_name: supplierName,
      items_required: itemsRequired,
      purpose: purpose,
      requested_by: requestedBy,
      department: department,
      request_date: requestDate || new Date().toISOString(),
      status: "draft",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error: insertError } = await supabaseAdmin
      .from("it_equipment_requisitions")
      .insert([insertData])
      .select()

    if (insertError) {
      console.error("[it-requisitions] Error creating requisition:", insertError)
      return NextResponse.json(
        { error: insertError.message || "Failed to create requisition" },
        { status: 500 }
      )
    }

    console.log("[it-requisitions] Requisition created successfully:", data)

    return NextResponse.json({
      success: true,
      message: "IT equipment requisition created successfully",
      requisition: data?.[0],
      requisitionNumber
    })

  } catch (error: any) {
    console.error("[it-requisitions] Error:", error)
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
    const requestedBy = searchParams.get("requestedBy")

    console.log("[it-requisitions] Loading IT equipment requisitions:", { status, department })

    let query = supabaseAdmin
      .from("it_equipment_requisitions")
      .select("*")
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (department && department !== "all") {
      query = query.eq("department", department)
    }

    if (requestedBy) {
      query = query.eq("requested_by", requestedBy)
    }

    const { data, error } = await query

    if (error) {
      console.error("[it-requisitions] Error loading requisitions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      requisitions: data || []
    })

  } catch (error: any) {
    console.error("[it-requisitions] Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
