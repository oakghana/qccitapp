"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Upload, AlertTriangle, Clock, Zap, Loader2 } from "lucide-react"
import { FormNavigation } from "@/components/ui/form-navigation"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { notificationService } from "@/lib/notification-service"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface NewTicketFormProps {
  onClose: () => void
  onTicketCreated?: () => void
}

export function NewTicketForm({ onClose, onTicketCreated }: NewTicketFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "",
    location: "",
    description: "",
    requesterName: "",
    requesterEmail: "",
    requesterPhone: "",
    department: "",
    officeNumber: "",
  })

  const [locations, setLocations] = useState<string[]>([])

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/admin/lookup-data?type=locations")
        if (response.ok) {
          const data = await response.json()
          const activeLocations = data
            .filter((loc: any) => loc.is_active !== false)
            .map((loc: any) => loc.name)
          setLocations(activeLocations)
        }
      } catch (error) {
        console.error("[v0] Error fetching locations:", error)
      }
    }
    fetchLocations()
  }, [])

  const categories = [
    { value: "hardware", label: "Hardware Issues", description: "Computer, printer, phone problems" },
    { value: "software", label: "Software Issues", description: "Application errors, installation problems" },
    { value: "network", label: "Network & Internet", description: "Connectivity, email, VPN issues" },
    { value: "account", label: "Account & Access", description: "Login problems, password resets" },
    { value: "mobile", label: "Mobile Devices", description: "Smartphone, tablet support" },
    { value: "other", label: "Other", description: "General IT support requests" },
  ]

  const priorities = [
    { value: "low", label: "Low", icon: Clock, color: "text-green-600", description: "Non-urgent, can wait" },
    {
      value: "medium",
      label: "Medium",
      icon: AlertTriangle,
      color: "text-orange-600",
      description: "Important, needs attention",
    },
    { value: "high", label: "High", icon: Zap, color: "text-red-600", description: "Urgent, affects work" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      // Save ticket via API (bypasses RLS)
      const response = await fetch("/api/service-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          priority: formData.priority || "medium",
          location: formData.location || user?.location,
          requested_by: formData.requesterName || user?.full_name || user?.name,
          requester_name: formData.requesterName || user?.full_name || user?.name,
          requester_email: formData.requesterEmail || user?.email,
          requester_phone: formData.requesterPhone,
          requester_department: formData.department,
          requester_room_number: formData.officeNumber,
          description: formData.description,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Error creating ticket:", result.error)
        setError(result.error || "Failed to create ticket")
        notificationService.error(
          "Failed to Create Ticket",
          result.error || "Failed to create support ticket"
        )
        return
      }

      console.log("[v0] Ticket created successfully:", result.ticket)

      // Show success message
      notificationService.success(
        "Ticket Created Successfully! 🎫",
        `Ticket ${result.ticket?.ticket_number || result.ticket?.id} has been submitted and assigned to IT support`
      )

      // Reset form and close
      setFormData({
        title: "",
        category: "",
        priority: "",
        location: "",
        description: "",
        requesterName: "",
        requesterEmail: "",
        requesterPhone: "",
        department: "",
        officeNumber: "",
      })
      
      // Notify parent to refresh
      if (onTicketCreated) {
        onTicketCreated()
      }
      onClose()
    } catch (err) {
      console.error("[v0] Exception creating ticket:", err)
      setError("An unexpected error occurred")
      notificationService.error(
        "Error",
        "An unexpected error occurred while creating ticket"
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="p-0">
        <DialogTitle className="sr-only">Submit IT Support Request</DialogTitle>
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Submit IT Support Request</CardTitle>
            <CardDescription>Describe your IT issue and we'll assign it to the appropriate team</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <FormNavigation currentPage="/dashboard/service-desk" className="mb-4" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Requester Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Requester Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="requesterName">Full Name</Label>
                  <Input
                    id="requesterName"
                    value={formData.requesterName}
                    onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Your department"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requesterEmail">Email Address</Label>
                  <Input
                    id="requesterEmail"
                    type="email"
                    value={formData.requesterEmail}
                    onChange={(e) => setFormData({ ...formData, requesterEmail: e.target.value })}
                    placeholder="your.email@qcc.gov.gh"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requesterPhone">Phone Number</Label>
                  <Input
                    id="requesterPhone"
                    value={formData.requesterPhone}
                    onChange={(e) => setFormData({ ...formData, requesterPhone: e.target.value })}
                    placeholder="+233 XX XXX XXXX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="officeNumber">Office Number</Label>
                  <Input
                    id="officeNumber"
                    value={formData.officeNumber}
                    onChange={(e) => setFormData({ ...formData, officeNumber: e.target.value })}
                    placeholder="Room/Office number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Issue Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Issue Details</h3>

              <div className="space-y-2">
                <Label htmlFor="location">Office Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your office location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the problem"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        <div>
                          <div className="font-medium">{category.label}</div>
                          <div className="text-xs text-muted-foreground">{category.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority Level</Label>
                <div className="grid gap-2 md:grid-cols-3">
                  {priorities.map((priority) => {
                    const IconComponent = priority.icon
                    return (
                      <div
                        key={priority.value}
                        className={`p-2 border rounded-lg cursor-pointer transition-colors ${
                          formData.priority === priority.value
                            ? "border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700"
                            : "border-border hover:border-green-200 hover:bg-green-50/50 dark:hover:bg-green-950/10"
                        }`}
                        onClick={() => setFormData({ ...formData, priority: priority.value })}
                      >
                        <div className="flex items-center space-x-2">
                          <IconComponent className={`h-4 w-4 ${priority.color}`} />
                          <span className="font-medium text-sm">{priority.label}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{priority.description}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please provide detailed information about the issue, including any error messages, when it started, and steps you've already tried..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Attachments (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Drag and drop files here, or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">Screenshots, error logs, or other relevant files</p>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Ticket"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
