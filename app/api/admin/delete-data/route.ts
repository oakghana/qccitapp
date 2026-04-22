import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function POST(request: NextRequest) {
  try {
    const { dataType, confirmation } = await request.json()

    // Require explicit confirmation
    if (confirmation !== "DELETE_CONFIRMED") {
      return NextResponse.json(
        { error: "Deletion not confirmed. Please provide correct confirmation code." },
        { status: 400 }
      )
    }

    let deletedCount = 0

    console.log("[v0] Starting deletion of:", dataType)

    switch (dataType) {
      case "service_desk": {
        // Delete service desk tickets
        const { error: delError, count } = await supabaseAdmin
          .from("service_desk_tickets")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all

        if (delError) {
          console.error("[v0] Error deleting service desk tickets:", delError)
          return NextResponse.json({ error: "Failed to delete service desk data" }, { status: 500 })
        }

        deletedCount = count || 0
        console.log(`[v0] Deleted ${deletedCount} service desk tickets`)
        break
      }

      case "repairs": {
        // Delete repair-related data in order (due to foreign keys)
        // First delete repair invoices
        const { count: invoiceCount } = await supabaseAdmin
          .from("repair_invoices")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000")

        // Then delete repair assignments
        const { count: assignmentCount } = await supabaseAdmin
          .from("repair_assignments")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000")

        // Finally delete repair requests
        const { count: repairCount, error: repairError } = await supabaseAdmin
          .from("repair_requests")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000")

        if (repairError) {
          console.error("[v0] Error deleting repairs:", repairError)
          return NextResponse.json({ error: "Failed to delete repair data" }, { status: 500 })
        }

        deletedCount = (invoiceCount || 0) + (assignmentCount || 0) + (repairCount || 0)
        console.log(`[v0] Deleted ${repairCount} repairs, ${assignmentCount} assignments, ${invoiceCount} invoices`)
        break
      }

      case "assignments": {
        // Delete repair assignments
        const { error: delError, count } = await supabaseAdmin
          .from("repair_assignments")
          .delete()
          .neq("id", "00000000-0000-0000-0000-000000000000")

        if (delError) {
          console.error("[v0] Error deleting repair assignments:", delError)
          return NextResponse.json({ error: "Failed to delete assignment data" }, { status: 500 })
        }

        deletedCount = count || 0
        console.log(`[v0] Deleted ${deletedCount} repair assignments`)
        break
      }

      default:
        return NextResponse.json({ error: "Invalid data type for deletion" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${dataType} data`,
      deletedCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error deleting data:", error)
    return NextResponse.json({ error: "Failed to delete data from database" }, { status: 500 })
  }
}
