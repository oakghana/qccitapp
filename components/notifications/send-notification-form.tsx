"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

interface Notification {
  type: "email" | "sms"
  recipient: string
  recipientType: "service_provider" | "user" | "it_head"
  subject: string
  message: string
  relatedRequest?: string
  priority: "low" | "medium" | "high"
  attachments?: string[]
}

interface SendNotificationFormProps {
  onSubmit: (notification: Notification) => void
}

const notificationTemplates = {
  service_provider_pickup: {
    subject: "Device Pickup Required - {deviceName} ({requestId})",
    message:
      "Dear Service Provider,\n\nPlease arrange pickup of {deviceName} for repair service. The device is ready for collection at our Head Office.\n\nRequest ID: {requestId}\nDeadline: 2 weeks from pickup date\n\nAttached documents contain all necessary repair forms and specifications.\n\nBest regards,\nIT Department",
  },
  user_completion: {
    subject: "Device Repair Completed - {deviceName}",
    message:
      "Dear {userName},\n\nYour device repair has been completed successfully.\n\nDevice: {deviceName}\nRequest ID: {requestId}\n\nPlease collect your device from {collectionLocation}.\n\nThank you,\nIT Department",
  },
  it_head_collection: {
    subject: "Device Ready for Collection - {deviceName}",
    message:
      "Dear IT Head,\n\nA repaired device is ready for collection and return to the user.\n\nDevice: {deviceName}\nUser: {userName}\nRequest ID: {requestId}\n\nPlease coordinate collection with the user.\n\nBest regards,\nIT Department",
  },
}

export function SendNotificationForm({ onSubmit }: SendNotificationFormProps) {
  const [formData, setFormData] = useState<Notification>({
    type: "email",
    recipient: "",
    recipientType: "user",
    subject: "",
    message: "",
    relatedRequest: "",
    priority: "medium",
    attachments: [],
  })

  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [includeAttachments, setIncludeAttachments] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleInputChange = (field: keyof Notification, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey)
    if (templateKey && notificationTemplates[templateKey as keyof typeof notificationTemplates]) {
      const template = notificationTemplates[templateKey as keyof typeof notificationTemplates]
      setFormData((prev) => ({
        ...prev,
        subject: template.subject,
        message: template.message,
      }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Templates</CardTitle>
          <CardDescription>Choose a pre-built template to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service_provider_pickup">Service Provider - Device Pickup</SelectItem>
              <SelectItem value="user_completion">User - Repair Completed</SelectItem>
              <SelectItem value="it_head_collection">IT Head - Collection Required</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Notification Type</Label>
          <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipientType">Recipient Type</Label>
          <Select value={formData.recipientType} onValueChange={(value) => handleInputChange("recipientType", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service_provider">Service Provider</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="it_head">IT Head</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient {formData.type === "email" ? "Email" : "Phone Number"}</Label>
          <Input
            id="recipient"
            type={formData.type === "email" ? "email" : "tel"}
            value={formData.recipient}
            onChange={(e) => handleInputChange("recipient", e.target.value)}
            placeholder={formData.type === "email" ? "recipient@example.com" : "+233241234567"}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="relatedRequest">Related Request ID (Optional)</Label>
          <Input
            id="relatedRequest"
            value={formData.relatedRequest}
            onChange={(e) => handleInputChange("relatedRequest", e.target.value)}
            placeholder="RR-2024-001"
          />
        </div>
      </div>

      {/* Message Content */}
      <div className="space-y-4">
        {formData.type === "email" && (
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              placeholder="Email subject line"
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => handleInputChange("message", e.target.value)}
            placeholder="Enter your message..."
            rows={6}
            required
          />
          <p className="text-xs text-muted-foreground">
            Use placeholders like {"{deviceName}"}, {"{userName}"}, {"{requestId}"} for dynamic content
          </p>
        </div>
      </div>

      {/* Attachments */}
      {formData.type === "email" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attachments</CardTitle>
            <CardDescription>Include repair forms and documentation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeAttachments"
                checked={includeAttachments}
                onCheckedChange={(checked) => setIncludeAttachments(checked as boolean)}
              />
              <Label htmlFor="includeAttachments">Include standard repair documentation</Label>
            </div>

            {includeAttachments && (
              <div className="space-y-2">
                <Label>Standard Attachments:</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Checkbox defaultChecked />
                    <span>Repair Request Form</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox defaultChecked />
                    <span>Device Specifications</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox />
                    <span>Diagnostic Report</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox />
                    <span>Warranty Information</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit">Send Notification</Button>
      </div>
    </form>
  )
}
