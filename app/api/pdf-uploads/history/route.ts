import { NextResponse } from "next/server"
import { getDeletionHistory, getAllAuditLogs } from "@/lib/audit-logging"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const action = searchParams.get("action") as any

    let result

    if (action && action !== "all") {
      // Get all logs with specific action
      result = await getAllAuditLogs({
        action,
        limit,
        offset,
      })
    } else {
      // Get deletion history by default
      result = await getDeletionHistory(limit)
    }

    if (!result.logs) {
      return NextResponse.json(
        { error: "Failed to fetch history" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      logs: result.logs,
      total: result.total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("[v0] Error in GET /api/pdf-uploads/history:", error)
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    )
  }
}
