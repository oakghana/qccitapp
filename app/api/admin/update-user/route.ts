import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { userId, name, email, phone, role, location, password, changePassword, updatedBy } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data: currentUser } = await supabase.from("profiles").select("*").eq("id", userId).single()

    const updateData: any = {
      full_name: name,
      email: email,
      phone: phone,
      role: role,
      location: location,
      updated_at: new Date().toISOString(),
    }

    if (changePassword && password && password.length >= 6) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updateData.password_hash = hashedPassword
    }

    // Update user profile
    const { data, error } = await supabase.from("profiles").update(updateData).eq("id", userId).select()

    if (error) {
      console.error("[v0] Error updating user:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    const changes = []
    if (currentUser?.full_name !== name) changes.push(`name: ${currentUser?.full_name} → ${name}`)
    if (currentUser?.email !== email) changes.push(`email: ${currentUser?.email} → ${email}`)
    if (currentUser?.role !== role) changes.push(`role: ${currentUser?.role} → ${role}`)
    if (currentUser?.location !== location) changes.push(`location: ${currentUser?.location} → ${location}`)
    if (changePassword) changes.push("password changed")

    await supabase.from("audit_logs").insert({
      user_id: userId,
      username: updatedBy || "admin",
      action: "USER_UPDATED",
      resource: `profiles/${userId}`,
      details: `Updated user: ${name} (${email}). Changes: ${changes.join(", ")}`,
      severity: changePassword ? "high" : "medium",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    console.log("[v0] User updated successfully:", data)

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: data[0],
    })
  } catch (error) {
    console.error("[v0] Error in update user API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
