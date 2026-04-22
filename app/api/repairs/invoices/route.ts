import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const repairId = searchParams.get("repairId")
    const status = searchParams.get("status")
    const providerId = searchParams.get("providerId")

    console.log("[v0] API Repair Invoices GET - repairId:", repairId, "status:", status, "providerId:", providerId)

    let query = supabaseAdmin
      .from("repair_invoices")
      .select(`
        *,
        repair:repair_requests(
          id,
          task_number,
          device_name,
          issue_description,
          status,
          location
        )
      `)
      .order("created_at", { ascending: false })

    if (repairId) {
      query = query.eq("repair_id", repairId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (providerId) {
      query = query.eq("service_provider_id", providerId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error loading repair invoices:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Loaded repair invoices:", data?.length || 0)

    return NextResponse.json({ invoices: data || [] })
  } catch (error) {
    console.error("[v0] API Repair Invoices error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const repairId = formData.get("repairId") as string
    const invoiceNumber = formData.get("invoiceNumber") as string
    const totalAmount = parseFloat(formData.get("totalAmount") as string)
    const laborCost = parseFloat(formData.get("laborCost") as string) || 0
    const partsCost = parseFloat(formData.get("partsCost") as string) || 0
    const otherCharges = parseFloat(formData.get("otherCharges") as string) || 0
    const description = formData.get("description") as string
    const laborHours = parseFloat(formData.get("laborHours") as string) || null
    const partsUsed = formData.get("partsUsed") as string
    const uploadedBy = formData.get("uploadedBy") as string
    const uploadedByName = formData.get("uploadedByName") as string
    const serviceProviderId = formData.get("serviceProviderId") as string
    const serviceProviderName = formData.get("serviceProviderName") as string
    const file = formData.get("file") as File | null

    console.log("[v0] Creating repair invoice for repair:", repairId)

    if (!repairId || !invoiceNumber || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields: repairId, invoiceNumber, totalAmount" },
        { status: 400 }
      )
    }

    let fileUrl = null
    let fileName = null
    let fileType = null
    let fileSize = null

    // Handle file upload if provided
    if (file) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Create unique file name
      const timestamp = Date.now()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const storagePath = `repair-invoices/${repairId}/${timestamp}_${sanitizedName}`
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from("documents")
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) {
        console.error("[v0] Error uploading invoice file:", uploadError)
        // Continue without file - we'll still create the invoice record
      } else {
        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from("documents")
          .getPublicUrl(storagePath)
        
        fileUrl = urlData.publicUrl
        fileName = file.name
        fileType = file.type
        fileSize = buffer.length
        
        console.log("[v0] Invoice file uploaded:", fileUrl)
      }
    }

    // Parse parts used
    const partsArray = partsUsed ? partsUsed.split(",").map(p => p.trim()).filter(Boolean) : []

    // Insert invoice record
    const { data: invoice, error: insertError } = await supabaseAdmin
      .from("repair_invoices")
      .insert({
        repair_id: repairId,
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        labor_cost: laborCost,
        parts_cost: partsCost,
        other_charges: otherCharges,
        description: description || null,
        labor_hours: laborHours,
        parts_used: partsArray.length > 0 ? partsArray : null,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        file_size: fileSize,
        uploaded_by: uploadedBy || null,
        uploaded_by_name: uploadedByName || null,
        service_provider_id: serviceProviderId || null,
        service_provider_name: serviceProviderName || null,
        status: "pending",
      })
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error creating invoice:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Update repair request to mark it has invoice
    await supabaseAdmin
      .from("repair_requests")
      .update({
        has_invoice: true,
        invoice_id: invoice.id,
        actual_cost: totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", repairId)

    console.log("[v0] Invoice created successfully:", invoice.id)

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("[v0] API Repair Invoices POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, action, approvedBy, approvalNotes } = body

    console.log("[v0] Updating repair invoice:", id, "action:", action)

    if (!id || !action) {
      return NextResponse.json(
        { error: "Missing required fields: id, action" },
        { status: 400 }
      )
    }

    let updateData: any = {
      updated_at: new Date().toISOString(),
    }

    switch (action) {
      case "approve":
        updateData.status = "approved"
        updateData.approved_by = approvedBy
        updateData.approved_at = new Date().toISOString()
        updateData.approval_notes = approvalNotes || null
        break
      case "reject":
        updateData.status = "rejected"
        updateData.approved_by = approvedBy
        updateData.approved_at = new Date().toISOString()
        updateData.approval_notes = approvalNotes || "Invoice rejected"
        break
      case "paid":
        updateData.status = "paid"
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const { data: invoice, error } = await supabaseAdmin
      .from("repair_invoices")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating invoice:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update repair request if invoice is approved
    if (action === "approve") {
      await supabaseAdmin
        .from("repair_requests")
        .update({
          invoice_approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoice.repair_id)
    }

    console.log("[v0] Invoice updated successfully:", invoice.id)

    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("[v0] API Repair Invoices PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
