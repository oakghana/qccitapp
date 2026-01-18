"use client"

import { useState, useEffect } from "react"
import { dateFmt } from "@/lib/format-utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  Clock,
  User,
  MapPin,
  Monitor,
  Wifi,
  Smartphone,
  Printer,
  Settings,
  HelpCircle,
  Edit,
  CheckCircle,
  ArrowUp,
  Wrench,
  AlertTriangle,
  Send,
} from "lucide-react"
import { AssignTicketDialog } from "./assign-ticket-dialog"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { canSeeAllLocations } from "@/lib/location-filter"

interface Ticket {
  id: string
  title: string
  category: string
  priority: string
  status: string
  location: string
  requester: string
  assignee: string
  created: string
  updated: string
  description: string
  comments: Array<{
    id: string
    author: string
    message: string
    timestamp: string
  }>
}

export function TicketList({ tickets: propTickets }: { tickets?: Ticket[] }) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [escalationDialogOpen, setEscalationDialogOpen] = useState(false)
  const [escalationReason, setEscalationReason] = useState("")
  const [escalationSuccess, setEscalationSuccess] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [dbLocations, setDbLocations] = useState<{ code: string; name: string }[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!propTickets) {
      loadTickets()
    }
    loadLocations()
  }, [propTickets])

  const loadLocations = async () => {
    try {
      const res = await fetch("/api/admin/lookup-data?type=locations")
      if (res.ok) {
        const data = await res.json()
        const activeLocations = data
          .filter((loc: any) => loc.is_active && loc.code && loc.code.trim() !== "")
          .map((loc: any) => ({
            code: loc.code,
            name: loc.name,
          }))
        setDbLocations(activeLocations)
      }
    } catch (error) {
      console.error("Error loading locations:", error)
    }
  }

  const loadTickets = async () => {
    try {
      setLoading(true)
      const location = user?.location || ""
      const canSeeAll = user ? canSeeAllLocations(user) : false
      
      console.log("[v0] Loading tickets via API for user:", user?.role, "location:", location, "canSeeAll:", canSeeAll)
      
      // Use API endpoint that bypasses RLS
      const params = new URLSearchParams({
        location: location,
        canSeeAll: String(canSeeAll),
        userRole: user?.role || "",
        userId: user?.full_name || user?.name || "",
      })
      
      const response = await fetch(`/api/service-tickets?${params}`)
      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Error loading tickets:", result.error)
        return
      }

      console.log("[v0] Loaded tickets from API:", result.tickets?.length || 0, "tickets")

      const mappedTickets: Ticket[] = (result.tickets || []).map((ticket: any) => ({
        id: ticket.ticket_number || ticket.id,
        title: ticket.title,
        category: ticket.category || "Other",
        priority: ticket.priority || "Medium",
        status: ticket.status || "Open",
        location: ticket.location || "Unknown",
        requester: ticket.requested_by || "Unknown",
        assignee: ticket.assigned_to || "Unassigned",
        created: dateFmt(ticket.created_at),
        updated: dateFmt(ticket.updated_at || ticket.created_at),
        description: ticket.description || "",
        comments: [],
      }))

      setTickets(mappedTickets)
    } catch (error) {
      console.error("[v0] Error loading tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateTicketInDatabase = async (ticketId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from("service_tickets")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("ticket_number", ticketId)
        .eq("id", ticketId)

      if (error) {
        console.error("[v0] Error updating ticket:", error)
        return false
      }

      await loadTickets()
      return true
    } catch (error) {
      console.error("[v0] Error updating ticket:", error)
      return false
    }
  }

  const categoryIcons = {
    Hardware: Monitor,
    Software: Smartphone,
    Network: Wifi,
    Account: User,
    Printer: Printer,
    Other: HelpCircle,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "destructive"
      case "In Progress":
        return "default"
      case "Resolved":
        return "secondary"
      case "Escalated":
        return "default"
      default:
        return "outline"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "destructive"
      case "Medium":
        return "default"
      case "Low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setViewDetailsOpen(true)
  }

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket({ ...ticket })
    setEditDialogOpen(true)
  }

  const handleUpdateTicket = async () => {
    if (editingTicket) {
      const updateSuccess = await updateTicketInDatabase(editingTicket.id, {
        title: editingTicket.title,
        status: editingTicket.status,
        priority: editingTicket.priority,
        assignee: editingTicket.assignee,
        description: editingTicket.description,
      })

      if (updateSuccess) {
        setEditDialogOpen(false)
        setEditingTicket(null)
      }
    }
  }

  const handleAddComment = async () => {
    if (selectedTicket && newComment.trim()) {
      const updatedTicket = {
        ...selectedTicket,
        comments: [
          ...selectedTicket.comments,
          {
            id: `c${Date.now()}`,
            author: "Current User",
            message: newComment,
            timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          },
        ],
      }

      const updateSuccess = await updateTicketInDatabase(selectedTicket.id, {
        comments: updatedTicket.comments,
      })

      if (updateSuccess) {
        setSelectedTicket(updatedTicket)
        setNewComment("")
        setCommentDialogOpen(false)
      }
    }
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    await updateTicketInDatabase(ticketId, { status: newStatus })
  }

  const handleEscalateToRepair = async () => {
    if (selectedTicket && escalationReason.trim()) {
      const repairRequest = {
        id: `REP-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
        deviceId: `DEV-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
        deviceName: selectedTicket.title.split(" - ")[0] || "Device",
        issueDescription: selectedTicket.description,
        priority: selectedTicket.priority.toLowerCase(),
        status: "pending_approval",
        requestedBy: selectedTicket.requester,
        location: selectedTicket.location,
        escalatedFrom: selectedTicket.id,
        escalationReason: escalationReason,
        submittedAt: new Date().toISOString(),
      }

      const updatedTicket = {
        ...selectedTicket,
        status: "Escalated",
        comments: [
          ...selectedTicket.comments,
          {
            id: `c${Date.now()}`,
            author: "Service Desk Admin",
            message: `Ticket escalated to repair team. Repair request ${repairRequest.id} created. Reason: ${escalationReason}`,
            timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          },
        ],
      }

      const updateSuccess = await updateTicketInDatabase(selectedTicket.id, {
        status: updatedTicket.status,
        comments: updatedTicket.comments,
      })

      if (updateSuccess) {
        const existingRepairs = JSON.parse(localStorage.getItem("repairRequests") || "[]")
        existingRepairs.push(repairRequest)
        localStorage.setItem("repairRequests", JSON.stringify(existingRepairs))

        setEscalationSuccess(true)
        setEscalationReason("")
        setEscalationDialogOpen(false)

        setTimeout(() => {
          setEscalationSuccess(false)
          setViewDetailsOpen(false)
        }, 3000)
      }
    }
  }

  const handleAssignTicket = async (assignment: any) => {
    if (selectedTicket) {
      try {
        // Call API to assign ticket
        const response = await fetch(`/api/service-tickets/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: selectedTicket.id,
            assignee: assignment.assignee,
            priority: assignment.priority,
            dueDate: assignment.dueDate,
            instructions: assignment.instructions,
            assignedBy: user?.full_name || user?.name || user?.username,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error("[v0] Error assigning ticket:", error)
          return
        }

        console.log(`[v0] Ticket ${selectedTicket.id} assigned to ${assignment.assignee}`)
        
        setAssignDialogOpen(false)
        await loadTickets()
      } catch (error) {
        console.error("[v0] Error assigning ticket:", error)
      }
    }
  }

  const isItHeadOrAdmin = user?.role === "it_head" || user?.role === "admin" || user?.role === "regional_it_head" || user?.role?.startsWith("service_desk_")

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setPriorityFilter("all")
    setLocationFilter("all")
  }

  const displayTickets = propTickets || tickets

  const filteredTickets = displayTickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter
    const matchesLocation = locationFilter === "all" || ticket.location === locationFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesLocation
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading tickets...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {escalationSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Ticket successfully escalated to repair team. A repair request has been created and the IT repair team has
            been notified.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filter Tickets</CardTitle>
          <CardDescription>Search and filter IT support tickets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {dbLocations.map((loc) => (
                  <SelectItem key={loc.code} value={loc.code}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full bg-transparent" onClick={clearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredTickets.map((ticket) => {
          const IconComponent = categoryIcons[ticket.category as keyof typeof categoryIcons] || HelpCircle
          return (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-2 bg-green-100 dark:bg-green-950/30 rounded-lg">
                      <IconComponent className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{ticket.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {ticket.id}
                        </Badge>
                      </div>

                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{ticket.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{ticket.requester}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{ticket.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Created {ticket.created}</span>
                        </div>
                        {ticket.assignee !== "Unassigned" && (
                          <div className="flex items-center space-x-1">
                            <Settings className="h-3 w-3" />
                            <span>Assigned to {ticket.assignee}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                      <Badge variant={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleViewTicket(ticket)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditTicket(ticket)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTicket(ticket)
                          setCommentDialogOpen(true)
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Comment
                      </Button>
                      {isItHeadOrAdmin && ticket.status !== "Resolved" && ticket.status !== "Escalated" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setAssignDialogOpen(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      )}
                      {ticket.status !== "Resolved" && ticket.status !== "Escalated" && (
                        <Button variant="ghost" size="sm" onClick={() => handleStatusChange(ticket.id, "Resolved")}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTickets.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tickets found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria or create a new ticket</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ticket Details - {selectedTicket?.id}</DialogTitle>
            <DialogDescription>{selectedTicket?.title}</DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Status:</strong> {selectedTicket.status}
                </div>
                <div>
                  <strong>Priority:</strong> {selectedTicket.priority}
                </div>
                <div>
                  <strong>Category:</strong> {selectedTicket.category}
                </div>
                <div>
                  <strong>Location:</strong> {selectedTicket.location}
                </div>
                <div>
                  <strong>Requester:</strong> {selectedTicket.requester}
                </div>
                <div>
                  <strong>Assignee:</strong> {selectedTicket.assignee}
                </div>
              </div>
              <div>
                <strong>Description:</strong>
                <p className="mt-1 text-muted-foreground">{selectedTicket.description}</p>
              </div>
              <div>
                <strong>Comments ({selectedTicket.comments.length}):</strong>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {selectedTicket.comments.map((comment) => (
                    <div key={comment.id} className="p-2 bg-muted rounded">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{comment.author}</span>
                        <span>{comment.timestamp}</span>
                      </div>
                      <p className="text-sm">{comment.message}</p>
                    </div>
                  ))}
                </div>
              </div>
              {selectedTicket.status !== "Resolved" && selectedTicket.status !== "Escalated" && (
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedTicket(selectedTicket)
                      setEscalationDialogOpen(true)
                    }}
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900/40"
                  >
                    <ArrowUp className="h-4 w-4 mr-2" />
                    Escalate to Repair Team
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Ticket - {editingTicket?.id}</DialogTitle>
            <DialogDescription>Update ticket information</DialogDescription>
          </DialogHeader>
          {editingTicket && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editingTicket.title}
                  onChange={(e) => setEditingTicket({ ...editingTicket, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editingTicket.status}
                    onValueChange={(value) => setEditingTicket({ ...editingTicket, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={editingTicket.priority}
                    onValueChange={(value) => setEditingTicket({ ...editingTicket, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Input
                  value={editingTicket.assignee}
                  onChange={(e) => setEditingTicket({ ...editingTicket, assignee: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingTicket.description}
                  onChange={(e) => setEditingTicket({ ...editingTicket, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateTicket}
                  className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
                >
                  Update Ticket
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>Add a comment to ticket {selectedTicket?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddComment}
                className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
              >
                Add Comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={escalationDialogOpen} onOpenChange={setEscalationDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-green-600 dark:text-green-400" />
              Escalate to Repair Team
            </DialogTitle>
            <DialogDescription>
              This will create a repair request and transfer the issue to the IT repair team for hardware intervention.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
              <AlertTriangle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Ticket:</strong> {selectedTicket?.id} - {selectedTicket?.title}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="escalation-reason">Escalation Reason</Label>
              <Textarea
                id="escalation-reason"
                placeholder="Explain why this ticket needs to be escalated to the repair team (e.g., hardware replacement required, device needs physical repair, etc.)"
                value={escalationReason}
                onChange={(e) => setEscalationReason(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">What happens next:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>A repair request will be created automatically</li>
                <li>The IT repair team will be notified</li>
                <li>This ticket status will change to "Escalated"</li>
                <li>The repair team will handle hardware intervention</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEscalationDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEscalateToRepair}
                disabled={!escalationReason.trim()}
                className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Escalate to Repair Team
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Ticket Dialog */}
      {selectedTicket && (
        <AssignTicketDialog
          ticketId={selectedTicket.id}
          ticketTitle={selectedTicket.title}
          ticketLocation={selectedTicket.location}
          isOpen={assignDialogOpen}
          onClose={() => setAssignDialogOpen(false)}
          onAssign={handleAssignTicket}
        />
      )}
    </div>
  )
}
