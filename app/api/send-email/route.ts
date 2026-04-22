import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail, generateAssignmentEmailHTML, generateAssignmentEmailText } from "@/lib/email-service"

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co"),
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-build-key")
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, to, subject, message, data } = body

    console.log("[v0] Email request:", { type, to })

    // Get SMTP settings from database
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("system_settings")
      .select("key, value, value_type")

    if (settingsError) {
      console.error("[v0] Error fetching SMTP settings:", settingsError)
      return NextResponse.json(
        { error: "Failed to load email settings" },
        { status: 500 }
      )
    }

    // Parse settings
    const settingsMap: Record<string, any> = {}
    settings?.forEach((setting) => {
      try {
        if (setting.value_type === "boolean") {
          settingsMap[setting.key] = setting.value === "true" || setting.value === true
        } else if (setting.value_type === "number") {
          settingsMap[setting.key] = parseInt(setting.value)
        } else {
          settingsMap[setting.key] = setting.value?.replace(/^"|"$/g, '') || setting.value
        }
      } catch (e) {
        settingsMap[setting.key] = setting.value
      }
    })

    // Check if email notifications are enabled
    if (!settingsMap.enable_email_notifications) {
      console.log("[v0] Email notifications are disabled in system settings")
      return NextResponse.json(
        { error: "Email notifications are disabled" },
        { status: 403 }
      )
    }

    // Validate SMTP configuration
    if (!settingsMap.smtp_server || !settingsMap.smtp_username || !settingsMap.smtp_password) {
      console.error("[v0] SMTP settings incomplete")
      return NextResponse.json(
        { error: "SMTP settings not configured. Please configure in System Settings." },
        { status: 400 }
      )
    }

    // Configure SMTP
    const smtpConfig = {
      host: settingsMap.smtp_server,
      port: settingsMap.smtp_port || 587,
      secure: settingsMap.smtp_port === 465,
      auth: {
        user: settingsMap.smtp_username,
        pass: settingsMap.smtp_password,
      },
    }

    let emailHtml = ""
    let emailText = ""

    // Generate email content based on type
    if (type === "ticket_assignment" && data) {
      emailHtml = generateAssignmentEmailHTML(data)
      emailText = generateAssignmentEmailText(data)
    } else if (type === "test") {
      emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #667eea;">Test Email from QCC IT System</h2>
          <p>This is a test email to verify your SMTP configuration is working correctly.</p>
          <p><strong>Message:</strong> ${message || 'Test successful!'}</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            Sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      `
      emailText = `Test Email from QCC IT System\n\n${message || 'Test successful!'}\n\nSent at: ${new Date().toLocaleString()}`
    } else {
      // Generic email
      emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>${subject}</h2>
          <p>${message}</p>
        </div>
      `
      emailText = message
    }

    // Send email
    const result = await sendEmail(
      {
        to,
        subject: subject || "Notification from QCC IT System",
        html: emailHtml,
        text: emailText,
      },
      smtpConfig
    )

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to send email" },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("[v0] Email API error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
