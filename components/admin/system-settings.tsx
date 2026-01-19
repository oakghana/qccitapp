"use client"

import { useState } from "react"
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
import { Settings, Mail, MessageSquare, Shield, Upload, Download, Database, HardDrive, Trash2, AlertTriangle } from "lucide-react"

export function SystemSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<"service_desk" | "repairs" | "assignments" | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [restoreFile, setRestoreFile] = useState<File | null>(null)
  const [backupData, setBackupData] = useState<any>(null)

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
                <Input id="companyName" defaultValue="Quality Control Company Limited" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemEmail">System Email</Label>
                <Input id="systemEmail" type="email" defaultValue="system@qccghana.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repairDeadline">Default Repair Deadline (days)</Label>
                <Input id="repairDeadline" type="number" defaultValue="14" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="backupFrequency">Backup Frequency (hours)</Label>
                <Input id="backupFrequency" type="number" defaultValue="24" />
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
                <Input id="smtpServer" defaultValue="smtp.gmail.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input id="smtpPort" type="number" defaultValue="587" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpUsername">SMTP Username</Label>
                <Input id="smtpUsername" defaultValue="notifications@qccghana.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <Input id="smtpPassword" type="password" defaultValue="••••••••" />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email notifications for system events</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Delivery Reports</Label>
                  <p className="text-sm text-muted-foreground">Track email delivery status</p>
                </div>
                <Switch defaultChecked />
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
                <Input id="smsProvider" defaultValue="Twilio" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smsApiKey">API Key</Label>
                <Input id="smsApiKey" type="password" defaultValue="••••••••••••••••" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smsFromNumber">From Number</Label>
                <Input id="smsFromNumber" defaultValue="+233XXXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smsRateLimit">Rate Limit (per hour)</Label>
                <Input id="smsRateLimit" type="number" defaultValue="100" />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send SMS notifications for urgent events</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Delivery Reports</Label>
                  <p className="text-sm text-muted-foreground">Track SMS delivery status</p>
                </div>
                <Switch defaultChecked />
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
                <Input id="sessionTimeout" type="number" defaultValue="30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otpExpiry">OTP Expiry (minutes)</Label>
                <Input id="otpExpiry" type="number" defaultValue="5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input id="maxLoginAttempts" type="number" defaultValue="3" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">Min Password Length</Label>
                <Input id="passwordMinLength" type="number" defaultValue="8" />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require OTP for Login</Label>
                  <p className="text-sm text-muted-foreground">Enable two-factor authentication</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">Log all user actions for security</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-lock Inactive Accounts</Label>
                  <p className="text-sm text-muted-foreground">Lock accounts after 90 days of inactivity</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button size="lg">Save All Settings</Button>
        </div>
      </div>
    </div>
  )
}
