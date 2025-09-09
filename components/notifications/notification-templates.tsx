import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, MessageSquare, Building, Users } from "lucide-react"

const emailTemplates = [
  {
    id: "service_provider_pickup",
    name: "Service Provider - Device Pickup",
    description: "Notify service provider to collect device for repair",
    subject: "Device Pickup Required - {deviceName} ({requestId})",
    body: `Dear Service Provider,

Please arrange pickup of {deviceName} for repair service. The device is ready for collection at our Head Office.

Request Details:
- Request ID: {requestId}
- Device: {deviceName}
- Serial Number: {serialNumber}
- Reported Issue: {issueDescription}

Important Notes:
- Repair deadline: 2 weeks from pickup date
- All required forms and specifications are attached
- Please confirm pickup within 24 hours

Contact our IT department at +233-XXX-XXXX for any questions.

Best regards,
IT Department
Ghana Company Ltd.`,
    variables: ["{deviceName}", "{requestId}", "{serialNumber}", "{issueDescription}"],
  },
  {
    id: "user_completion",
    name: "User - Repair Completed",
    description: "Notify user when device repair is completed",
    subject: "Device Repair Completed - {deviceName}",
    body: `Dear {userName},

Great news! Your device repair has been completed successfully.

Repair Details:
- Device: {deviceName}
- Request ID: {requestId}
- Completion Date: {completionDate}
- Service Provider: {serviceProvider}

Collection Information:
- Location: {collectionLocation}
- Contact: {contactPerson}
- Phone: {contactPhone}

Please collect your device at your earliest convenience during business hours (8:00 AM - 5:00 PM).

Thank you for your patience.

Best regards,
IT Department`,
    variables: [
      "{userName}",
      "{deviceName}",
      "{requestId}",
      "{completionDate}",
      "{serviceProvider}",
      "{collectionLocation}",
      "{contactPerson}",
      "{contactPhone}",
    ],
  },
  {
    id: "it_head_collection",
    name: "IT Head - Collection Required",
    description: "Notify regional IT head to collect repaired device",
    subject: "Device Ready for Collection - {deviceName}",
    body: `Dear IT Head,

A repaired device is ready for collection and return to the user.

Device Information:
- Device: {deviceName}
- Request ID: {requestId}
- User: {userName}
- User Location: {userLocation}
- Completion Date: {completionDate}

Action Required:
1. Collect device from Head Office
2. Coordinate with user for handover
3. Confirm device functionality with user
4. Update system status to "Delivered"

Please arrange collection within 2 business days.

Best regards,
IT Department`,
    variables: ["{deviceName}", "{requestId}", "{userName}", "{userLocation}", "{completionDate}"],
  },
]

const smsTemplates = [
  {
    id: "repair_approved",
    name: "Repair Request Approved",
    description: "SMS notification when repair request is approved",
    body: "Your repair request {requestId} for {deviceName} has been approved. Device will be transferred to Head Office for service. Updates will follow.",
    variables: ["{requestId}", "{deviceName}"],
  },
  {
    id: "repair_completed_sms",
    name: "Repair Completed",
    description: "SMS notification when repair is completed",
    body: "Good news! Your {deviceName} repair is complete (Req: {requestId}). Please collect from {collectionLocation}. Contact: {contactPhone}",
    variables: ["{deviceName}", "{requestId}", "{collectionLocation}", "{contactPhone}"],
  },
  {
    id: "pickup_reminder",
    name: "Pickup Reminder",
    description: "Reminder SMS for device collection",
    body: "Reminder: Your repaired {deviceName} is ready for collection at {location}. Please collect during business hours. Req: {requestId}",
    variables: ["{deviceName}", "{location}", "{requestId}"],
  },
]

export function NotificationTemplates() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="email" className="space-y-4">
        <TabsList>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Templates
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4">
          <div className="grid gap-4">
            {emailTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {template.name.includes("Service Provider") ? (
                          <Building className="h-5 w-5 text-primary" />
                        ) : (
                          <Users className="h-5 w-5 text-primary" />
                        )}
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <Badge variant="outline">Email</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Subject:</h4>
                    <p className="text-sm font-mono bg-muted p-2 rounded">{template.subject}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Message Body:</h4>
                    <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap font-mono">{template.body}</pre>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Available Variables:</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <div className="grid gap-4">
            {smsTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <Badge variant="outline">SMS</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Message:</h4>
                    <p className="text-sm bg-muted p-3 rounded">{template.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">Length: {template.body.length} characters</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Available Variables:</h4>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
