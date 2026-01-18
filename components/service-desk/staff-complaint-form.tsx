"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
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
import { useToast } from "@/hooks/use-toast"
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

// We'll load complaints (service tickets) from the API
const initialComplaints: Complaint[] = []

export function StaffComplaintForm() {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as const,
    officeNumber: "",
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
      // Call API to create ticket
      const body = {
        title: formData.title,
        description: formData.description,
        category: formData.category || 'other',
        priority: formData.priority || 'medium',
        location: user?.location || '',
        office_number: formData.officeNumber || '',
        // prefer stable id for requested_by so server filtering is reliable
        requested_by: user?.id || user?.full_name || user?.name || '',
      }

      const res = await fetch('/api/service-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit complaint')

      // refresh list
      await loadComplaints()

      setFormData({ title: '', description: '', category: '', priority: 'medium', officeNumber: '' })
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    } catch (error) {
      console.error("Error submitting complaint:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const [loadedComplaints, setLoadedComplaints] = useState<Complaint[]>(initialComplaints)
  const userComplaints = useMemo(
    () => loadedComplaints.filter((c) => c.submittedBy === (user?.id || user?.full_name || user?.name)),
    [loadedComplaints, user?.id, user?.full_name, user?.name]
  )
  const { toast } = useToast()
  const { getUserLocation } = useAuth()

  const loadComplaints = async () => {
    try {
      const location = getUserLocation() || ''
      const params = new URLSearchParams({
        location,
        canSeeAll: 'false',
        userRole: user?.role || '',
        // pass a stable identifier for server-side filtering
        userId: (user?.id || user?.full_name || user?.name || ''),
      })
      const res = await fetch(`/api/service-tickets?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) {
        console.error('Failed to load complaints', data)
        return
      }

      const mapped = (data.tickets || []).map((t: any) => ({
        id: t.ticket_number || t.id,
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        status: t.status || 'submitted',
        submittedBy: t.requested_by || '',
        submittedAt: t.created_at || new Date().toISOString(),
        location: t.location || '',
        assignedTo: t.assigned_to_name || t.assigned_to || null,
        attachments: t.attachments || [],
      }))

      setLoadedComplaints(mapped)
    } catch (error) {
      console.error('Error loading complaints', error)
    }
  }

  useEffect(() => {
    loadComplaints()
  }, [user?.id, user?.full_name, user?.role])

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
                <Label htmlFor="officeNumber">Office Number (optional)</Label>
                <Input
                  id="officeNumber"
                  placeholder="e.g. B-204 or Office 12"
                  value={formData.officeNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, officeNumber: e.target.value }))}
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
              {loadedComplaints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No complaints submitted yet</p>
                  <p className="text-sm">Submit your first IT support request above</p>
                </div>
              ) : (
                ((user?.role === 'admin' || user?.role === 'it_head') ? loadedComplaints : userComplaints).map((complaint) => (
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

                    <div className="flex justify-end gap-2">
                      {/* Allow edit/delete only if not assigned */}
                      {(!complaint.assignedTo || complaint.assignedTo === null) ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const newTitle = prompt('Edit title', complaint.title)
                              if (newTitle === null) return
                              const newDesc = prompt('Edit description', complaint.description)
                              try {
                                const res = await fetch('/api/service-tickets', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: complaint.id,
                                    title: newTitle || complaint.title,
                                    description: newDesc || complaint.description,
                                    requested_by: user?.id || user?.full_name || user?.name || '',
                                    userRole: user?.role || '',
                                  }),
                                })
                                const data = await res.json()
                                if (!res.ok) throw new Error(data.error || 'Failed to update')
                                toast?.({ title: 'Complaint updated', description: 'Your complaint was updated.', variant: 'default' })
                                await loadComplaints()
                              } catch (err) {
                                console.error(err)
                                toast?.({ title: 'Update failed', description: (err as any).message || 'Could not update complaint', variant: 'destructive' })
                              }
                            }}
                          >
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (!confirm('Are you sure you want to delete this complaint?')) return
                              try {
                                const res = await fetch('/api/service-tickets', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: complaint.id, requested_by: user?.id || user?.full_name || user?.name || '', userRole: user?.role || '' }),
                                })
                                const data = await res.json()
                                if (!res.ok) throw new Error(data.error || 'Failed to delete')
                                toast?.({ title: 'Complaint deleted', description: 'Your complaint was deleted.', variant: 'default' })
                                await loadComplaints()
                              } catch (err) {
                                console.error(err)
                                toast?.({ title: 'Delete failed', description: (err as any).message || 'Could not delete complaint', variant: 'destructive' })
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" disabled title="Assigned complaints cannot be edited or deleted">
                          Edit
                        </Button>
                      )}
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
