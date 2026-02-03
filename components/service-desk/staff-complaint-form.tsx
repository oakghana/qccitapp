"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertTriangle, Paperclip, Send, Trash2, Edit } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { FormNavigation } from "@/components/ui/form-navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface Complaint {
  id: string
  title: string
  description: string
  category: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "submitted" | "assigned" | "in_progress" | "resolved" | "escalated" | "open" | "Open"
  submittedBy: string
  submittedAt: string
  location: string
  assignedTo?: string
  resolvedAt?: string
  attachments?: string[]
  dbId?: string  // Database ID for deleting
}

// In-memory storage for complaints
const complaints: Complaint[] = []

export function StaffComplaintForm() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [userComplaintsList, setUserComplaintsList] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as const,
    officeNumber: "",
    attachments: [] as File[],
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

  const userComplaints = userComplaintsList; // Declare userComplaints variable

  const setUserComplaints = setUserComplaintsList; // Declare setUserComplaints variable

  useEffect(() => {
    loadUserComplaints()
  }, [user])

  const loadUserComplaints = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading complaints for user:", user?.name || user?.full_name)

      // Fetch tickets from API (which filters by requester for staff)
      const params = new URLSearchParams({
        location: user?.location || "",
        canSeeAll: "false",
        userRole: user?.role || "staff",
        userId: user?.full_name || user?.name || "",
      })

      const response = await fetch(`/api/service-tickets?${params}`)
      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Error loading complaints:", result.error)
        return
      }

      console.log("[v0] Loaded", result.tickets?.length || 0, "complaints for user")

      const mappedComplaints: Complaint[] = (result.tickets || []).map((ticket: any) => ({
        id: ticket.ticket_number || ticket.id,
        dbId: ticket.id,
        title: ticket.title,
        description: ticket.description || "",
        category: ticket.category || "other",
        priority: (ticket.priority?.toLowerCase() as any) || "medium",
        status: ticket.status as any,
        submittedBy: ticket.requested_by || user?.name || "",
        submittedAt: ticket.created_at,
        location: ticket.location || user?.location || "",
        assignedTo: ticket.assigned_to_name || undefined,
        attachments: [],
      }))

      setUserComplaints(mappedComplaints) // Use setUserComplaints
    } catch (error) {
      console.error("[v0] Error loading complaints:", error)
    } finally {
      setLoading(false)
    }
  }

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
      // Convert attachments to base64 or store file names
      const attachmentNames = formData.attachments.map((file) => file.name)

      const response = await fetch("/api/service-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          priority: formData.priority || "medium",
          location: user?.location,
          office_number: formData.officeNumber,
          requested_by: user?.full_name || user?.name,
          description: formData.description,
          attachments: attachmentNames,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Error creating ticket:", result.error)
        toast({
          title: "❌ Failed to Submit Complaint",
          description: result.error || "Failed to submit your complaint",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Ticket created successfully:", result.ticket)
      toast({
        title: "🎫 Complaint Submitted Successfully",
        description: "Your IT support request has been submitted",
      })

      setFormData({
        title: "",
        description: "",
        category: "",
        priority: "medium",
        officeNumber: "",
        attachments: [],
      })

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
      
      // Reload complaints list
      await loadUserComplaints()
    } catch (error) {
      console.error("Error submitting complaint:", error)
      toast({
        title: "❌ Error",
        description: "An error occurred while submitting your complaint",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteComplaint = async (complaintId: string, complaintDbId: string) => {
    try {
      console.log("[v0] Deleting complaint:", complaintId)

      const response = await fetch("/api/service-tickets/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: complaintDbId,
          userId: user?.full_name || user?.name || user?.username,
          userRole: user?.role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Error deleting complaint:", result.error)
        toast({
          title: "❌ Failed to Delete Complaint",
          description: result.error || "Failed to delete complaint",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Complaint deleted successfully")
      toast({
        title: "🗑️ Complaint Deleted Successfully",
        description: result.message || "Your complaint has been deleted",
      })
      
      setShowDeleteConfirm(false)
      setDeleteConfirmId(null)
      await loadUserComplaints()
    } catch (error) {
      console.error("[v0] Error deleting complaint:", error)
      toast({
        title: "❌ Error",
        description: "An error occurred while deleting the complaint",
        variant: "destructive",
      })
    }
  }

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
                <Label htmlFor="officeNumber">Office Room Number</Label>
                <Input
                  id="officeNumber"
                  placeholder="e.g., Room 101, Block A"
                  value={formData.officeNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, officeNumber: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">Attachments (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    id="attachments"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt,.log"
                    onChange={(e) => {
                      const files = Array.from(e.currentTarget.files || [])
                      setFormData((prev) => ({ ...prev, attachments: files }))
                    }}
                    className="hidden"
                  />
                  <label htmlFor="attachments" className="cursor-pointer">
                    <div className="text-center">
                      <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Drag and drop files here or click to browse</p>
                      <p className="text-xs text-gray-500 mt-1">Screenshots, error logs, or other relevant files</p>
                    </div>
                  </label>
                  {formData.attachments.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-gray-700">Selected files:</p>
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                attachments: prev.attachments.filter((_, i) => i !== index),
                              }))
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Loading your complaints...</p>
                </div>
              ) : userComplaints.length === 0 ? (
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

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>Submitted: {new Date(complaint.submittedAt).toLocaleDateString()}</span>
                      {complaint.assignedTo && <span>Assigned to: {complaint.assignedTo}</span>}
                    </div>

                    {/* Action buttons for unassigned complaints */}
                    {!complaint.assignedTo && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 bg-transparent"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs h-7"
                          onClick={() => {
                            setDeleteConfirmId(complaint.dbId || complaint.id)
                            setShowDeleteConfirm(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Complaint
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this complaint? This action cannot be undone. Only unassigned complaints can be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) {
                  const complaint = userComplaints.find(c => c.dbId === deleteConfirmId || c.id === deleteConfirmId)
                  handleDeleteComplaint(complaint?.id || deleteConfirmId, complaint?.dbId || deleteConfirmId)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
