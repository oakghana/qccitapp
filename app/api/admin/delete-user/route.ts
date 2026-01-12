import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { userId, deletedBy, reason } = body

    if (!userId || !deletedBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Get user details before deletion
    const { data: user } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Soft delete: deactivate the user instead of hard delete
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_active: false,
        status: "suspended",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("[v0] Error deleting user:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log the deletion
    await supabase.from("audit_logs").insert({
      user_id: userId,
      username: deletedBy,
      action: "USER_SUSPENDED",
      resource: `profiles/${userId}`,
      details: `Suspended/deactivated user: ${user.full_name} (${user.email}). Reason: ${reason || "Not provided"}`,
      severity: "high",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    return NextResponse.json({ success: true, message: "User deactivated successfully" })
  } catch (error: any) {
    console.error("[v0] Error in delete-user route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
