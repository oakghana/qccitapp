"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Clock, AlertTriangle, Ticket, MapPin, Monitor, Wifi, Smartphone, Printer, UserPlus, Eye, CheckCircle, User, Calendar, FileText } from "lucide-react"
import { NewTicketForm } from "./new-ticket-form"
import { KnowledgeBase } from "./knowledge-base"
import { AssignTicketDialog } from "./assign-ticket-dialog"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { TicketList } from "./ticket-list" // Import TicketList component

export function ServiceDeskDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showNewTicketForm, setShowNewTicketForm] = useState(false)
  const [selectedTicketForAssign, setSelectedTicketForAssign] = useState<any>(null)
  const [selectedTicketForDetails, setSelectedTicketForDetails] = useState<any>(null)
  const [ticketDetails, setTicketDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const { canViewAllLocations, getUserLocation, user } = useAuth()
  const { toast } = useToast()
  const [allTickets, setAllTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Check if user can assign tickets (IT Head, Regional IT Head, Admin)
  const canAssignTickets = () => {
    return (
      user?.role === "admin" ||
      user?.role === "it_head" ||
      user?.role === "regional_it_head" ||
      user?.role === "service_desk_head"
    )
  }

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      setLoading(true)
      const location = getUserLocation() || ""
      const canSeeAll = canViewAllLocations()

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

      const mappedTickets = (result.tickets || []).map((ticket: any) => ({
        id: ticket.ticket_number || ticket.id,
        uuid: ticket.id, // Store actual UUID for API operations (delete, etc.)
        dbId: ticket.id, // Keep database ID for updates
        title: ticket.title,
        category: ticket.category || "Other",
        priority: ticket.priority || "Medium",
        status: ticket.status || "Open",
        location: ticket.location || "head_office",
        locationName: ticket.location || "Unknown Location",
        requester: ticket.requested_by || "Unknown",
        created: new Date(ticket.created_at).toLocaleString(),
        assignedTo: ticket.assigned_to_name || null,
        assignedToId: ticket.assigned_to || null,
      }))

      setAllTickets(mappedTickets)
    } catch (error) {
      console.error("[v0] Error loading tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  // Handle ticket assignment
  const handleAssignTicket = async (assignment: any) => {
    try {
      console.log("[v0] Assignment completed, refreshing tickets")

      // Just reload tickets - the dialog already made the API call
      await loadTickets()
    } catch (error) {
      console.error("[v0] Error refreshing tickets:", error)
    } finally {
      setSelectedTicketForAssign(null)
    }
  }

  // Load ticket details with updates history
  const loadTicketDetails = async (ticket: any) => {
    setSelectedTicketForDetails(ticket)
    setLoadingDetails(true)
    
    try {
      // Get ticket updates/history
      const { data: updates, error: updatesError } = await supabase
        .from("service_ticket_updates")
        .select("*")
        .eq("ticket_id", ticket.dbId)
        .order("created_at", { ascending: false })

      if (updatesError) {
        console.error("[v0] Error loading ticket updates:", updatesError)
      }

      // Get full ticket details
      const { data: fullTicket, error: ticketError } = await supabase
        .from("service_tickets")
        .select("*")
        .eq("id", ticket.dbId)
        .single()

      if (ticketError) {
        console.error("[v0] Error loading ticket details:", ticketError)
      }

      setTicketDetails({
        ...ticket,
        fullData: fullTicket,
        updates: updates || []
      })
    } catch (error) {
      console.error("[v0] Error loading ticket details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const filteredTickets = allTickets

  const stats = {
    totalTickets: filteredTickets.length,
    openTickets: filteredTickets.filter((t) => t.status === "Open" || t.status === "open").length,
    inProgress: filteredTickets.filter((t) => t.status === "In Progress" || t.status === "in_progress").length,
    resolved: filteredTickets.filter((t) => t.status === "Resolved" || t.status === "resolved").length,
    avgResolutionTime: "2.3 hours",
    satisfaction: "94%",
  }

  const categoryIcons = {
    Hardware: Monitor,
    Software: Smartphone,
    Network: Wifi,
    Printer: Printer,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading service desk...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">IT Service Desk</h1>
          <p className="text-muted-foreground">
            {user?.role === "user" || user?.role === "staff"
              ? "Request IT support and track your service tickets"
              : canViewAllLocations()
                ? "Manage IT support requests across all QCC office locations"
                : `Manage IT support requests for ${getUserLocation()}`}
          </p>
        </div>
        <Button
          onClick={() => setShowNewTicketForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setActiveTab("overview")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">
              {user?.role === "user" || user?.role === "staff"
                ? "Your requests"
                : canViewAllLocations()
                  ? "All locations"
                  : "This location"}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setActiveTab("overview")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => setActiveTab("overview")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resolved">Resolved Tickets</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* All Tickets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Tickets</CardTitle>
                  <CardDescription>
                    {user?.role === "user" || user?.role === "staff"
                      ? "All your IT support requests"
                      : canViewAllLocations()
                        ? "All IT support requests from all locations"
                        : "All IT support requests from your location"}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-sm">
                  {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Ticket className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No tickets found</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => {
                    const IconComponent = categoryIcons[ticket.category as keyof typeof categoryIcons] || Monitor
                    return (
                      <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 dark:bg-green-950/30 rounded-lg">
                            <IconComponent className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{ticket.title}</h4>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{ticket.locationName}</span>
                            <span>•</span>
                            <span>{ticket.requester}</span>
                            <span>•</span>
                            <span>{ticket.created}</span>
                            {ticket.assignedTo && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                  Assigned to: {ticket.assignedTo}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            ticket.priority === "High" || ticket.priority === "high"
                              ? "destructive"
                              : ticket.priority === "Medium" || ticket.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {ticket.priority}
                        </Badge>
                        <Badge
                          variant={ticket.status === "Open" || ticket.status === "open" ? "outline" : "secondary"}
                          className="text-xs"
                        >
                          {ticket.status}
                        </Badge>
                        {/* View Details button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950 bg-transparent"
                          onClick={() => loadTicketDetails(ticket)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        {/* Assign button for IT Heads */}
                        {canAssignTickets() && (ticket.status === "Open" || ticket.status === "open") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950 bg-transparent"
                            onClick={() => setSelectedTicketForAssign(ticket)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        )}
                      </div>
                    </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Tickets</CardTitle>
              <CardDescription>
                All tickets that have been resolved and closed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TicketList 
                tickets={allTickets.filter(t => t.status === "Resolved" || t.status === "resolved" || t.status === "Closed" || t.status === "closed")}
                onRefresh={loadTickets}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgeBase />
        </TabsContent>
      </Tabs>

      {/* New Ticket Form Modal */}
      {showNewTicketForm && <NewTicketForm onClose={() => setShowNewTicketForm(false)} onTicketCreated={loadTickets} />}

      {/* Assign Ticket Dialog */}
      {selectedTicketForAssign && (
        <AssignTicketDialog
          ticketId={selectedTicketForAssign.id}
          ticketTitle={selectedTicketForAssign.title}
          ticketLocation={selectedTicketForAssign.location}
          isOpen={!!selectedTicketForAssign}
          onClose={() => setSelectedTicketForAssign(null)}
          onAssign={handleAssignTicket}
        />
      )}

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicketForDetails} onOpenChange={(open) => !open && setSelectedTicketForDetails(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Ticket Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this service request
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading ticket details...</p>
            </div>
          ) : ticketDetails ? (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ticket ID</p>
                  <p className="font-mono text-sm">{ticketDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={ticketDetails.status === "Open" || ticketDetails.status === "open" ? "outline" : "secondary"}>
                    {ticketDetails.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <Badge variant={
                    ticketDetails.priority === "High" || ticketDetails.priority === "high" ? "destructive" :
                    ticketDetails.priority === "Medium" || ticketDetails.priority === "medium" ? "default" : "secondary"
                  }>
                    {ticketDetails.priority}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p>{ticketDetails.category || "General"}</p>
                </div>
              </div>

              <Separator />

              {/* Title & Description */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Title</p>
                <p className="font-medium">{ticketDetails.title}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{ticketDetails.fullData?.description || "No description provided"}</p>
              </div>

              <Separator />

              {/* Requester Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <User className="h-4 w-4" />
                  Requester Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Requested By</p>
                    <p>{ticketDetails.requester}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p>{ticketDetails.locationName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p>{ticketDetails.created}</p>
                  </div>
                </div>
              </div>

              {/* Assignment Info */}
              {ticketDetails.assignedTo && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    Assignment Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                      <p className="text-blue-700 dark:text-blue-300 font-medium">{ticketDetails.assignedTo}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                      <Badge variant="secondary">{ticketDetails.status}</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Work History */}
              {ticketDetails.updates && ticketDetails.updates.length > 0 && (
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Calendar className="h-4 w-4" />
                    Work History
                  </h4>
                  <div className="space-y-3">
                    {ticketDetails.updates.map((update: any, index: number) => (
                      <div key={index} className="border-l-2 border-green-200 pl-4 py-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{update.status || update.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(update.created_at).toLocaleString()}
                          </p>
                        </div>
                        {update.notes && <p className="text-sm text-muted-foreground mt-1">{update.notes}</p>}
                        <p className="text-xs text-muted-foreground">By: {update.updated_by || "System"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedTicketForDetails(null)}>
                  Close
                </Button>
                {canAssignTickets() && (ticketDetails.status === "Open" || ticketDetails.status === "open") && (
                  <Button 
                    onClick={() => {
                      setSelectedTicketForDetails(null)
                      setSelectedTicketForAssign(ticketDetails)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Ticket
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No ticket selected</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
