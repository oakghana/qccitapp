import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()

    // Get all system settings
    const { data: settings, error } = await supabase
      .from("system_settings")
      .select("*")
      .order("category")

    if (error) {
      console.error("[v0] Error fetching system settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert array to object with keys for easier access
    const settingsMap: Record<string, any> = {}
    if (settings) {
      settings.forEach((setting) => {
        settingsMap[setting.key] = {
          value: setting.value,
          category: setting.category,
          label: setting.label,
          description: setting.description,
          type: setting.type,
        }
      })
    }

    return NextResponse.json({ success: true, settings: settingsMap })
  } catch (error: any) {
    console.error("[v0] Error in get system settings:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { settings, updatedBy } = body

    if (!settings || !updatedBy) {
      return NextResponse.json({ error: "Settings and updatedBy are required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Verify user is admin
    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Saving system settings, updated by:", updatedBy)

    // Prepare settings for upsert
    const settingsToSave = Object.entries(settings).map(([key, setting]: [string, any]) => ({
      key,
      value: setting.value || setting,
      category: setting.category || "general",
      label: setting.label || key,
      description: setting.description || "",
      type: setting.type || "text",
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    }))

    // Upsert settings (insert or update)
    const { data: savedSettings, error: saveError } = await supabase
      .from("system_settings")
      .upsert(settingsToSave, { onConflict: "key" })
      .select()

    if (saveError) {
      console.error("[v0] Error saving system settings:", saveError)
      return NextResponse.json({ error: saveError.message }, { status: 500 })
    }

    // Log to audit trail
    await supabase.from("audit_logs").insert({
      user: updatedBy,
      action: "SYSTEM_SETTINGS_UPDATED",
      resource: "system_settings",
      details: `Updated ${Object.keys(settings).length} system settings`,
      severity: "info",
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    console.log("[v0] System settings saved successfully:", Object.keys(settings).length, "settings updated")

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      settingsCount: savedSettings.length,
    })
  } catch (error: any) {
    console.error("[v0] Error in save system settings:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
