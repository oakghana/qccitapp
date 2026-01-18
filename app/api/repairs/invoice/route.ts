import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const repairId = formData.get("repair_id") as string
    const serviceProviderId = formData.get("service_provider_id") as string
    const serviceProviderName = formData.get("service_provider_name") as string
    const uploadedBy = formData.get("uploaded_by") as string
    const uploadedByName = formData.get("uploaded_by_name") as string
    const invoiceNumber = formData.get("invoice_number") as string
    const invoiceDate = formData.get("invoice_date") as string
    const laborCost = formData.get("labor_cost") as string
    const partsCost = formData.get("parts_cost") as string
    const otherCharges = formData.get("other_charges") as string
    const totalAmount = formData.get("total_amount") as string
    const laborHours = formData.get("labor_hours") as string
    const description = formData.get("description") as string
    const file = formData.get("file") as File

    if (!repairId || !file || !serviceProviderId) {
      return NextResponse.json(
        { error: "Missing required fields: repair_id, service_provider_id, or file" },
        { status: 400 }
      )
    }

    console.log("[v0] Uploading invoice for repair:", repairId, "file:", file.name)

    // Upload file to Supabase Storage (using existing pdf-documents bucket)
    const fileName = `repair-invoices/${repairId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`
    const fileBuffer = await file.arrayBuffer()

    console.log("[v0] Uploading to storage with path:", fileName)

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("pdf-documents")
      .upload(fileName, fileBuffer, {
        contentType: file.type || "application/pdf",
        upsert: false,
      })

    if (uploadError) {
      console.error("[v0] Error uploading file to storage:", uploadError)
      console.error("[v0] Upload error details:", {
        message: uploadError.message,
        status: uploadError.status,
        statusCode: uploadError.statusCode,
        code: (uploadError as any).code,
      })
      return NextResponse.json({ error: `Failed to upload file: ${uploadError.message}` }, { status: 500 })
    }

    console.log("[v0] File uploaded successfully to:", uploadData.path)

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("pdf-documents").getPublicUrl(uploadData.path)

    console.log("[v0] File uploaded successfully:", publicUrl)

    // Create invoice record in database
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("repair_invoices")
      .insert({
        repair_id: repairId,
        service_provider_id: serviceProviderId,
        service_provider_name: serviceProviderName,
        uploaded_by: uploadedBy,
        uploaded_by_name: uploadedByName,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        labor_hours: laborHours ? Number.parseFloat(laborHours) : null,
        labor_cost: laborCost ? Number.parseFloat(laborCost) : null,
        parts_cost: partsCost ? Number.parseFloat(partsCost) : null,
        other_charges: otherCharges ? Number.parseFloat(otherCharges) : null,
        total_amount: totalAmount ? Number.parseFloat(totalAmount) : null,
        description: description || null,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (invoiceError) {
      console.error("[v0] Error creating invoice record:", invoiceError)
      return NextResponse.json({ error: "Failed to create invoice record" }, { status: 500 })
    }

    // Update repair_requests to link invoice
    const { error: updateError } = await supabaseAdmin
      .from("repair_requests")
      .update({
        invoice_id: invoice.id,
        has_invoice: true,
      })
      .eq("id", repairId)

    if (updateError) {
      console.warn("[v0] Warning: Could not update repair with invoice ID:", updateError)
    }

    console.log("[v0] Invoice uploaded successfully:", invoice.id)

    return NextResponse.json(
      {
        message: "Invoice uploaded successfully",
        invoice,
        publicUrl,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] API Repair Invoice Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const repairId = searchParams.get("repair_id")

    if (!repairId) {
      return NextResponse.json({ error: "repair_id is required" }, { status: 400 })
    }

    console.log("[v0] Fetching invoice for repair:", repairId)

    const { data, error } = await supabaseAdmin
      .from("repair_invoices")
      .select("*")
      .eq("repair_id", repairId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found - not an error
        return NextResponse.json({ invoice: null })
      }
      console.error("[v0] Error fetching invoice:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ invoice: data })
  } catch (error) {
    console.error("[v0] API Repair Invoice GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
