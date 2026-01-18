"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Upload, AlertTriangle, Clock, Zap, Loader2 } from "lucide-react"
import { FormNavigation } from "@/components/ui/form-navigation"
import { useAuth } from "@/lib/auth-context"

interface NewTicketFormProps {
  onClose: () => void
  onTicketCreated?: () => void
}

export function NewTicketForm({ onClose, onTicketCreated }: NewTicketFormProps) {
  const { user } = useAuth()
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
  

  const locations = [
    "Head Office - Accra",
    "Kumasi District Office",
    "Kaase Inland Port District Office",
    "Cape Coast District Office",
    "Ho District Office",
    "Sunyani District Office",
    "Koforidua District Office",
    "Wa District Office",
  ]

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
          office_number: formData.officeNumber || '',
          // prefer stable id for requested_by so server-side filtering works
          requested_by: user?.id || formData.requesterName || user?.full_name || user?.name,
          description: formData.description,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Error creating ticket:", result.error)
        setError(result.error || "Failed to create ticket")
        return
      }

      console.log("[v0] Ticket created successfully:", result.ticket)

      // Show success message
      alert(`Ticket ${result.ticket?.ticket_number || result.ticket?.id} has been created successfully!`)

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
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
            <div className="space-y-4">
              <h3 className="text-lg font-medium">New Request</h3>

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
                <Label htmlFor="officeNumber">Office Number</Label>
                <Input
                  id="officeNumber"
                  value={formData.officeNumber}
                  onChange={(e) => setFormData({ ...formData, officeNumber: e.target.value })}
                  placeholder="Room/Office number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Office Location</Label>
                <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your office location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Please provide detailed information about the issue, including error messages and steps you've tried..."
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Attachments (Optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Drag and drop files here, or click to browse</p>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}
            {/* Navigation / Submit Buttons */}
            <div className="flex justify-between items-center gap-4 pt-4 border-t">
              <div>
                <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700 text-white">
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
