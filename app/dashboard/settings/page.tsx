"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Settings,
  User,
  Lock,
  Bell,
  Shield,
  Smartphone,
  Key,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters long" })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: user?.username,
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Failed to change password" })
        setIsLoading(false)
        return
      }

      setMessage({ type: "success", text: "Password changed successfully" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("[v0] Password change error:", error)
      setMessage({ type: "error", text: "Failed to change password. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationSave = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setMessage({ type: "success", text: "Notification preferences saved successfully" })
      setIsLoading(false)
    }, 1000)
  }

  const handleSecuritySave = () => {
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setMessage({ type: "success", text: "Security settings updated successfully" })
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and security settings</p>
          </div>
        </div>

        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {user?.role?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </Badge>
      </div>

      {/* Message Display */}
      {message && (
        <Card
          className={cn(
            "border-l-4",
            message.type === "success" && "border-l-green-500 bg-green-50 dark:bg-green-950/50",
            message.type === "error" && "border-l-red-500 bg-red-50 dark:bg-red-950/50",
            message.type === "info" && "border-l-blue-500 bg-blue-50 dark:bg-blue-950/50",
          )}
        >
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              {message.type === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
              {message.type === "error" && <AlertTriangle className="h-4 w-4 text-red-600" />}
              {message.type === "info" && <Info className="h-4 w-4 text-blue-600" />}
              <p
                className={cn(
                  "text-sm font-medium",
                  message.type === "success" && "text-green-800 dark:text-green-300",
                  message.type === "error" && "text-red-800 dark:text-red-300",
                  message.type === "info" && "text-blue-800 dark:text-blue-300",
                )}
              >
                {message.text}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Your basic account information and role details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={user?.username || ""} disabled />
                  <p className="text-xs text-muted-foreground mt-1">Username cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={user?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground mt-1">Contact IT admin to change email</p>
                </div>

                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={user?.name || ""} disabled />
                  <p className="text-xs text-muted-foreground mt-1">Contact HR to update your name</p>
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={user?.role?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) || ""}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">Role assigned by system administrator</p>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={user?.location?.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) || ""}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-1">Your assigned work location</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password for enhanced security</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Password must be at least 8 characters long</p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                >
                  {isLoading ? "Changing Password..." : "Change Password"}
                  <Save className="h-4 w-4 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Use your phone to verify login attempts</p>
                </div>
                <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
              </div>

              {twoFactorEnabled && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Two-factor authentication is enabled. You'll receive SMS codes for login verification.
                  </p>
                </div>
              )}

              <Button onClick={handleSecuritySave} disabled={isLoading} variant="outline">
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive browser push notifications</p>
                  </div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">Important security notifications</p>
                  </div>
                  <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
                </div>
              </div>

              <Button
                onClick={handleNotificationSave}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white"
              >
                Save Notification Settings
                <Save className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>Control your privacy and data settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Activity Visibility</Label>
                  <p className="text-sm text-muted-foreground mb-3">Control who can see your activity and status</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="public" name="visibility" defaultChecked />
                      <Label htmlFor="public">Public - Visible to all team members</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="team" name="visibility" />
                      <Label htmlFor="team">Team - Visible to your team only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="private" name="visibility" />
                      <Label htmlFor="private">Private - Not visible to others</Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium">Data Usage</Label>
                  <p className="text-sm text-muted-foreground mb-3">How your data is used to improve the system</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Analytics Data</Label>
                        <p className="text-xs text-muted-foreground">Help improve system performance</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Usage Statistics</Label>
                        <p className="text-xs text-muted-foreground">Anonymous usage patterns</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleNotificationSave} disabled={isLoading} variant="outline">
                Save Privacy Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Account Actions
              </CardTitle>
              <CardDescription>Manage your account data and access</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">Request Account Deletion</h4>
                <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                  This action cannot be undone. Contact your system administrator to request account deletion.
                </p>
                <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent">
                  Contact Administrator
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
