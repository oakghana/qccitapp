"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertTriangle, Paperclip, Send } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { FormNavigation } from "@/components/ui/form-navigation"

interface Complaint {
  id: string
  title: string
  description: string
  category: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "submitted" | "assigned" | "in_progress" | "resolved" | "escalated"
  submittedBy: string
  submittedAt: string
  location: string
  assignedTo?: string
  resolvedAt?: string
  attachments?: string[]
}

// In-memory storage for complaints
const complaints: Complaint[] = [
  {
    id: "CMP-001",
    title: "Computer won't start",
    description:
      "My desktop computer is not turning on when I press the power button. The power light doesn't come on at all.",
    category: "hardware",
    priority: "high",
    status: "in_progress",
    submittedBy: "John Mensah",
    submittedAt: "2024-01-15T09:30:00Z",
    location: "head_office",
    assignedTo: "Head Office Service Desk Staff",
  },
  {
    id: "CMP-002",
    title: "Email not working",
    description: "I cannot send or receive emails. Getting error message 'Cannot connect to server'.",
    category: "software",
    priority: "medium",
    status: "resolved",
    submittedBy: "Akosua Asante",
    submittedAt: "2024-01-14T14:20:00Z",
    location: "kumasi",
    assignedTo: "Kumasi Service Desk Staff",
    resolvedAt: "2024-01-14T16:45:00Z",
  },
]

export function StaffComplaintForm() {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as const,
  })

  const categories = [
    { value: "hardware", label: "Hardware Issues" },
    { value: "software", label: "Software Problems" },
    { value: "network", label: "Network/Internet" },
    { value: "email", label: "Email Issues" },
    { value: "printer", label: "Printer Problems" },
    { value: "phone", label: "Phone System" },
    { value: "access", label: "Access/Login Issues" },
    { value: "other", label: "Other" },
  ]

  const priorities = [
    { value: "low", label: "Low", color: "bg-blue-100 text-blue-800" },
    { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
    { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newComplaint: Complaint = {
        id: `CMP-${String(complaints.length + 1).padStart(3, "0")}`,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: "submitted",
        submittedBy: user?.name || "Unknown User",
        submittedAt: new Date().toISOString(),
        location: user?.location || "head_office",
      }

      complaints.push(newComplaint)

      setFormData({
        title: "",
        description: "",
        category: "",
        priority: "medium",
      })

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    } catch (error) {
      console.error("Error submitting complaint:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const userComplaints = complaints.filter((c) => c.submittedBy === user?.name)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <Clock className="h-4 w-4" />
      case "assigned":
      case "in_progress":
        return <AlertTriangle className="h-4 w-4" />
      case "resolved":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-gray-100 text-gray-800"
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "escalated":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <FormNavigation currentPage="/dashboard/complaints" />

      <div>
        <h1 className="text-2xl font-bold text-foreground">IT Support Complaints</h1>
        <p className="text-muted-foreground">Submit and track your IT support requests</p>
      </div>

      {showSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your complaint has been submitted successfully and assigned a ticket number.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Submit New Complaint */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Submit New Complaint
            </CardTitle>
            <CardDescription>Describe your IT issue and we'll assign it to the appropriate team</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  required
                >
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
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData((prev) => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${priority.color.split(" ")[0]}`} />
                          {priority.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide detailed information about the issue, including any error messages and steps you've already tried..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Attachments (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Drag and drop files here or click to browse</p>
                  <p className="text-xs text-gray-500 mt-1">Screenshots, error logs, or other relevant files</p>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Complaint"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* My Complaints */}
        <Card>
          <CardHeader>
            <CardTitle>My Complaints</CardTitle>
            <CardDescription>Track the status of your submitted complaints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userComplaints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No complaints submitted yet</p>
                  <p className="text-sm">Submit your first IT support request above</p>
                </div>
              ) : (
                userComplaints.map((complaint) => (
                  <div key={complaint.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{complaint.title}</h4>
                        <p className="text-sm text-muted-foreground">#{complaint.id}</p>
                      </div>
                      <Badge className={getStatusColor(complaint.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(complaint.status)}
                          {complaint.status.replace("_", " ")}
                        </div>
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Submitted: {new Date(complaint.submittedAt).toLocaleDateString()}</span>
                      {complaint.assignedTo && <span>Assigned to: {complaint.assignedTo}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
