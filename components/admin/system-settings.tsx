"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Settings, Mail, MessageSquare, Shield, Upload, Download, Database, HardDrive, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function SystemSettings() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<"service_desk" | "repairs" | "assignments" | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [backupData, setBackupData] = useState<any>(null)
  const [testEmailAddress, setTestEmailAddress] = useState("")
  const [sendingTestEmail, setSendingTestEmail] = useState(false)

  // General Settings
  const [companyName, setCompanyName] = useState("Quality Control Company Limited")
  const [systemEmail, setSystemEmail] = useState("system@qccghana.com")
  const [repairDeadline, setRepairDeadline] = useState("14")
  const [backupFrequency, setBackupFrequency] = useState("24")

  // Email Settings
  const [smtpServer, setSmtpServer] = useState("smtp.gmail.com")
  const [smtpPort, setSmtpPort] = useState("587")
  const [smtpUsername, setSmtpUsername] = useState("notifications@qccghana.com")
  const [smtpPassword, setSmtpPassword] = useState("••••••••")
  const [enableEmailNotifications, setEnableEmailNotifications] = useState(true)
  const [enableEmailReports, setEnableEmailReports] = useState(true)

  // SMS Settings
  const [smsProvider, setSmsProvider] = useState("Twilio")
  const [smsApiKey, setSmsApiKey] = useState("••••••••••••••••")
  const [smsFromNumber, setSmsFromNumber] = useState("+233XXXXXXXXX")
  const [smsRateLimit, setSmsRateLimit] = useState("100")
  const [enableSmsNotifications, setEnableSmsNotifications] = useState(true)
  const [enableSmsReports, setEnableSmsReports] = useState(true)

  // Security Settings
  const [sessionTimeout, setSessionTimeout] = useState("30")
  const [otpExpiry, setOtpExpiry] = useState("5")
  const [maxLoginAttempts, setMaxLoginAttempts] = useState("3")
  const [passwordMinLength, setPasswordMinLength] = useState("8")
  const [requireOtp, setRequireOtp] = useState(true)
  const [enableAuditLogging, setEnableAuditLogging] = useState(true)
  const [autoLockInactive, setAutoLockInactive] = useState(true)

  // Load settings from database on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/system-settings")
      const data = await response.json()

      if (response.ok && data.settings) {
        const settings = data.settings
        console.log("[v0] Loaded system settings from database:", settings)

        // Load General Settings
        if (settings.companyName?.value) setCompanyName(settings.companyName.value)
        if (settings.systemEmail?.value) setSystemEmail(settings.systemEmail.value)
        if (settings.repairDeadline?.value) setRepairDeadline(settings.repairDeadline.value.toString())
        if (settings.backupFrequency?.value) setBackupFrequency(settings.backupFrequency.value.toString())

        // Load Email Settings
        if (settings.smtpServer?.value) setSmtpServer(settings.smtpServer.value)
        if (settings.smtpPort?.value) setSmtpPort(settings.smtpPort.value.toString())
        if (settings.smtpUsername?.value) setSmtpUsername(settings.smtpUsername.value)
        if (settings.smtpPassword?.value && settings.smtpPassword.value !== "••••••••") setSmtpPassword(settings.smtpPassword.value)
        if (settings.enableEmailNotifications?.value !== undefined) setEnableEmailNotifications(settings.enableEmailNotifications.value === true || settings.enableEmailNotifications.value === "true")
        if (settings.enableEmailReports?.value !== undefined) setEnableEmailReports(settings.enableEmailReports.value === true || settings.enableEmailReports.value === "true")

        // Load SMS Settings
        if (settings.smsProvider?.value) setSmsProvider(settings.smsProvider.value)
        if (settings.smsApiKey?.value && settings.smsApiKey.value !== "••••••••••••••••") setSmsApiKey(settings.smsApiKey.value)
        if (settings.smsFromNumber?.value) setSmsFromNumber(settings.smsFromNumber.value)
        if (settings.smsRateLimit?.value) setSmsRateLimit(settings.smsRateLimit.value.toString())
        if (settings.enableSmsNotifications?.value !== undefined) setEnableSmsNotifications(settings.enableSmsNotifications.value === true || settings.enableSmsNotifications.value === "true")
        if (settings.enableSmsReports?.value !== undefined) setEnableSmsReports(settings.enableSmsReports.value === true || settings.enableSmsReports.value === "true")

        // Load Security Settings
        if (settings.sessionTimeout?.value) setSessionTimeout(settings.sessionTimeout.value.toString())
        if (settings.otpExpiry?.value) setOtpExpiry(settings.otpExpiry.value.toString())
        if (settings.maxLoginAttempts?.value) setMaxLoginAttempts(settings.maxLoginAttempts.value.toString())
        if (settings.passwordMinLength?.value) setPasswordMinLength(settings.passwordMinLength.value.toString())
        if (settings.requireOtp?.value !== undefined) setRequireOtp(settings.requireOtp.value === true || settings.requireOtp.value === "true")
        if (settings.enableAuditLogging?.value !== undefined) setEnableAuditLogging(settings.enableAuditLogging.value === true || settings.enableAuditLogging.value === "true")
        if (settings.autoLockInactive?.value !== undefined) setAutoLockInactive(settings.autoLockInactive.value === true || settings.autoLockInactive.value === "true")

        setMessage({ type: "info", text: "Settings loaded from database" })
      }
    } catch (error) {
      console.error("[v0] Error loading settings:", error)
      setMessage({ type: "error", text: "Failed to load settings from database" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAllSettings = async () => {
    if (!user) {
      setMessage({ type: "error", text: "User not authenticated" })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const allSettings = {
        // General Settings
        companyName: { value: companyName, category: "general" },
        systemEmail: { value: systemEmail, category: "general" },
        repairDeadline: { value: Number(repairDeadline), category: "general" },
        backupFrequency: { value: Number(backupFrequency), category: "general" },

        // Email Settings
        smtpServer: { value: smtpServer, category: "email" },
        smtpPort: { value: Number(smtpPort), category: "email" },
        smtpUsername: { value: smtpUsername, category: "email" },
        smtpPassword: { value: smtpPassword, category: "email" },
        enableEmailNotifications: { value: enableEmailNotifications, category: "email" },
        enableEmailReports: { value: enableEmailReports, category: "email" },

        // SMS Settings
        smsProvider: { value: smsProvider, category: "sms" },
        smsApiKey: { value: smsApiKey, category: "sms" },
        smsFromNumber: { value: smsFromNumber, category: "sms" },
        smsRateLimit: { value: Number(smsRateLimit), category: "sms" },
        enableSmsNotifications: { value: enableSmsNotifications, category: "sms" },
        enableSmsReports: { value: enableSmsReports, category: "sms" },

        // Security Settings
        sessionTimeout: { value: Number(sessionTimeout), category: "security" },
        otpExpiry: { value: Number(otpExpiry), category: "security" },
        maxLoginAttempts: { value: Number(maxLoginAttempts), category: "security" },
        passwordMinLength: { value: Number(passwordMinLength), category: "security" },
        requireOtp: { value: requireOtp, category: "security" },
        enableAuditLogging: { value: enableAuditLogging, category: "security" },
        autoLockInactive: { value: autoLockInactive, category: "security" },
      }

      console.log("[v0] Saving all system settings...")

      const response = await fetch("/api/admin/system-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: allSettings,
          updatedBy: user.full_name || user.email,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save settings")
      }

      console.log("[v0] System settings saved successfully:", result.settingsCount)
      setMessage({
        type: "success",
        text: `All system settings saved successfully! (${result.settingsCount} settings updated)`,
      })
    } catch (error: any) {
      console.error("[v0] Error saving settings:", error)
      setMessage({ type: "error", text: error.message || "Failed to save settings" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmailAddress) {
      setMessage({ type: "error", text: "Please enter an email address to send test email" })
      return
    }

    setSendingTestEmail(true)
    setMessage(null)

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "test",
          to: testEmailAddress,
          subject: "Test Email from QCC IT System",
          message: `This is a test email to verify SMTP configuration. If you receive this, your email settings are working correctly!`,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: `Test email sent successfully to ${testEmailAddress}! Check your inbox.`,
        })
      } else {
        setMessage({
          type: "error",
          text: result.error || "Failed to send test email. Please check your SMTP settings.",
        })
      }
    } catch (error: any) {
      console.error("[v0] Error sending test email:", error)
      setMessage({
        type: "error",
        text: error.message || "Failed to send test email. Please check your SMTP configuration.",
      })
    } finally {
      setSendingTestEmail(false)
    }
  }

  const handleBackupDatabase = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/backup-database", {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: result.error || "Failed to backup database" })
        setIsLoading(false)
        return
      }

      // Download backup as JSON file
      const blob = new Blob([JSON.stringify(result.backup, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `database-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setMessage({ type: "success", text: "Database backup completed and downloaded successfully" })
      setBackupData(result.backup)
    } catch (error) {
      console.error("[v0] Backup error:", error)
      setMessage({ type: "error", text: "Failed to backup database" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestoreDatabase = async () => {
    if (!restoreFile) {
      setMessage({ type: "error", text: "Please select a backup file to restore" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const fileContent = await restoreFile.text()
      const backupData = JSON.parse(fileContent)

      const response = await fetch("/api/admin/restore-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupData }),
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: result.error || "Failed to restore database" })
        setIsLoading(false)
        return
      }

      setMessage({
        type: "success",
        text: `Database restored successfully. ${result.tablesRestored} tables with ${result.recordsRestored} total records restored.`,
      })
      setRestoreFile(null)
    } catch (error) {
      console.error("[v0] Restore error:", error)
      setMessage({ type: "error", text: "Failed to restore database from backup file" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteData = async () => {
    if (deleteConfirmation !== "DELETE_CONFIRMED") {
      setMessage({ type: "error", text: "Incorrect confirmation code. Please type exactly: DELETE_CONFIRMED" })
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/delete-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataType: deleteType,
          confirmation: "DELETE_CONFIRMED",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: result.error || "Failed to delete data" })
        setIsLoading(false)
        setDeleteDialogOpen(false)
        return
      }

      setMessage({
        type: "success",
        text: `Successfully deleted ${deleteType} data. ${result.deletedCount} records removed from database.`,
      })
      setDeleteDialogOpen(false)
      setDeleteConfirmation("")
      setDeleteType(null)
    } catch (error) {
      console.error("[v0] Delete error:", error)
      setMessage({ type: "error", text: "Failed to delete data" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">System Settings</h2>
        <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
      </div>

      <div className="grid gap-6">
        {message && (
          <Alert variant={message.type === "error" ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Database Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Database Management
            </CardTitle>
            <CardDescription>Backup, restore, and manage database operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Backup Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Backup Database
                </h4>
                <p className="text-sm text-muted-foreground">Create a complete backup of all database tables and data</p>
              </div>
              <Button
                onClick={handleBackupDatabase}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? "Creating Backup..." : "Create Database Backup"}
              </Button>
            </div>

            <Separator />

            {/* Restore Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Restore Database
                </h4>
                <p className="text-sm text-muted-foreground">Restore database from a previously created backup file</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".json"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleRestoreDatabase}
                  disabled={isLoading || !restoreFile}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isLoading ? "Restoring..." : "Restore Backup"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Delete Data Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2 text-red-600">
                  <Trash2 className="h-4 w-4" />
                  Permanently Delete Data
                </h4>
                <p className="text-sm text-muted-foreground">Permanently remove specific data types from database</p>
              </div>

              <Alert variant="destructive" className="border-red-400 bg-red-50 dark:bg-red-950/50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800 dark:text-red-300">
                  Warning: These operations are permanent and cannot be undone. Create a backup before deleting data.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={() => {
                    setDeleteType("service_desk")
                    setDeleteDialogOpen(true)
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Service Desk
                </Button>
                <Button
                  onClick={() => {
                    setDeleteType("repairs")
                    setDeleteDialogOpen(true)
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Repairs
                </Button>
                <Button
                  onClick={() => {
                    setDeleteType("assignments")
                    setDeleteDialogOpen(true)
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Assignments
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Bulk Data Management
            </CardTitle>
            <CardDescription>Import and export system data in bulk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Import Data</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input type="file" accept=".csv,.xlsx" className="flex-1" />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Users
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="file" accept=".csv,.xlsx" className="flex-1" />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Devices
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="file" accept=".csv,.xlsx" className="flex-1" />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Locations
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium">Export Data</h4>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Devices
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Export All Locations
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Export System Report
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic system configuration options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemEmail">System Email</Label>
                <Input id="systemEmail" type="email" value={systemEmail} onChange={(e) => setSystemEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repairDeadline">Default Repair Deadline (days)</Label>
                <Input id="repairDeadline" type="number" value={repairDeadline} onChange={(e) => setRepairDeadline(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Backup Frequency (hours)</Label>
                <Input id="backupFrequency" type="number" value={backupFrequency} onChange={(e) => setBackupFrequency(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
            <CardDescription>Configure email server and notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpServer">SMTP Server</Label>
                <Input 
                  id="smtpServer" 
                  value={smtpServer} 
                  onChange={(e) => setSmtpServer(e.target.value)}
                  placeholder="smtp.gmail.com" 
                />
                <p className="text-xs text-muted-foreground">For Gmail: smtp.gmail.com</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input 
                  id="smtpPort" 
                  type="number" 
                  value={smtpPort} 
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="587" 
                />
                <p className="text-xs text-muted-foreground">Common ports: 587 (TLS) or 465 (SSL)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpUsername">SMTP Username (Email)</Label>
                <Input 
                  id="smtpUsername" 
                  type="email"
                  value={smtpUsername} 
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  placeholder="your-email@gmail.com" 
                />
                <p className="text-xs text-muted-foreground">Your full Gmail address</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP Password / App Password</Label>
                <Input 
                  id="smtpPassword" 
                  type="password" 
                  value={smtpPassword} 
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="Enter password or app password" 
                />
                <p className="text-xs text-muted-foreground">
                  For Gmail: Use an App Password (not your regular password).
                  <a 
                    href="https://support.google.com/accounts/answer/185833" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    Learn how
                  </a>
                </p>
              </div>
            </div>
            
            {/* Test Email Section */}
            <Separator />
            <div className="space-y-3">
              <Label htmlFor="testEmail">Test Email Configuration</Label>
              <div className="flex gap-2">
                <Input 
                  id="testEmail"
                  type="email"
                  placeholder="Enter email address to test" 
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button"
                  onClick={handleTestEmail}
                  disabled={sendingTestEmail || !testEmailAddress}
                  variant="outline"
                >
                  {sendingTestEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Send a test email to verify your SMTP configuration is working correctly
              </p>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email notifications for system events</p>
                </div>
                <Switch checked={enableEmailNotifications} onCheckedChange={setEnableEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Delivery Reports</Label>
                  <p className="text-sm text-muted-foreground">Track email delivery status</p>
                </div>
                <Switch checked={enableEmailReports} onCheckedChange={setEnableEmailReports} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMS Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS Configuration
            </CardTitle>
            <CardDescription>Configure SMS gateway and messaging settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smsProvider">SMS Provider</Label>
                <Input id="smsProvider" value={smsProvider} onChange={(e) => setSmsProvider(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smsApiKey">API Key</Label>
                <Input id="smsApiKey" type="password" value={smsApiKey} onChange={(e) => setSmsApiKey(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smsFromNumber">From Number</Label>
                <Input id="smsFromNumber" value={smsFromNumber} onChange={(e) => setSmsFromNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smsRateLimit">Rate Limit (per hour)</Label>
                <Input id="smsRateLimit" type="number" value={smsRateLimit} onChange={(e) => setSmsRateLimit(e.target.value)} />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send SMS notifications for urgent events</p>
                </div>
                <Switch checked={enableSmsNotifications} onCheckedChange={setEnableSmsNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Delivery Reports</Label>
                  <p className="text-sm text-muted-foreground">Track SMS delivery status</p>
                </div>
                <Switch checked={enableSmsReports} onCheckedChange={setEnableSmsReports} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure authentication and security policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input id="sessionTimeout" type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otpExpiry">OTP Expiry (minutes)</Label>
                <Input id="otpExpiry" type="number" value={otpExpiry} onChange={(e) => setOtpExpiry(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input id="maxLoginAttempts" type="number" value={maxLoginAttempts} onChange={(e) => setMaxLoginAttempts(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">Min Password Length</Label>
                <Input id="passwordMinLength" type="number" value={passwordMinLength} onChange={(e) => setPasswordMinLength(e.target.value)} />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require OTP for Login</Label>
                  <p className="text-sm text-muted-foreground">Enable two-factor authentication</p>
                </div>
                <Switch checked={requireOtp} onCheckedChange={setRequireOtp} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">Log all user actions for security</p>
                </div>
                <Switch checked={enableAuditLogging} onCheckedChange={setEnableAuditLogging} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-lock Inactive Accounts</Label>
                  <p className="text-sm text-muted-foreground">Lock accounts after 90 days of inactivity</p>
                </div>
                <Switch checked={autoLockInactive} onCheckedChange={setAutoLockInactive} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-2">
          <Button onClick={loadSettings} variant="outline" disabled={isSaving || isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Reload Settings
          </Button>
          <Button onClick={handleSaveAllSettings} size="lg" disabled={isSaving} className="bg-green-600 hover:bg-green-700">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Save All Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
