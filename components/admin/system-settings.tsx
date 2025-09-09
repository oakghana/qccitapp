import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, Mail, MessageSquare, Shield, Upload, Download, Database } from "lucide-react"

export function SystemSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">System Settings</h2>
        <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Bulk Import/Export Section */}
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
