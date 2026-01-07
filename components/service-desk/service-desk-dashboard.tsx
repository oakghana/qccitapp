"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, AlertTriangle, Ticket, MapPin, Monitor, Wifi, Smartphone, Printer } from "lucide-react"
import { NewTicketForm } from "./new-ticket-form"
import { TicketList } from "./ticket-list"
import { KnowledgeBase } from "./knowledge-base"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

export function ServiceDeskDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showNewTicketForm, setShowNewTicketForm] = useState(false)
  const { canViewAllLocations, getUserLocation } = useAuth()
  const [allTickets, setAllTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadTickets()
  }, [])

  const loadTickets = async () => {
    try {
      setLoading(true)
      let query = supabase.from("service_tickets").select("*").order("created_at", { ascending: false })

      if (!canViewAllLocations() && getUserLocation()) {
        query = query.eq("location", getUserLocation())
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error loading tickets:", error)
        return
      }

      console.log("[v0] Loaded tickets from Supabase:", data)

      const mappedTickets = data.map((ticket: any) => ({
        id: ticket.ticket_number || ticket.id,
        title: ticket.title,
        category: ticket.category || "Other",
        priority: ticket.priority || "Medium",
        status: ticket.status || "Open",
        location: ticket.location || "head_office",
        locationName: ticket.location || "Unknown Location",
        requester: ticket.requested_by || "Unknown",
        created: new Date(ticket.created_at).toLocaleString(),
      }))

      setAllTickets(mappedTickets)
    } catch (error) {
      console.error("[v0] Error loading tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = canViewAllLocations()
    ? allTickets
    : allTickets.filter((ticket) => ticket.location === getUserLocation())

  const recentTickets = filteredTickets.slice(0, 3)

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
            {canViewAllLocations()
              ? "Manage IT support requests across all QCC office locations"
              : `Manage IT support requests for ${getUserLocation() === "head_office" ? "Head Office" : "Kumasi District Office"}`}
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-muted-foreground">{canViewAllLocations() ? "All locations" : "This location"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.openTickets}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
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
          <TabsTrigger value="tickets">All Tickets</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>
                {canViewAllLocations()
                  ? "Latest IT support requests from all locations"
                  : "Latest IT support requests from your location"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTickets.map((ticket) => {
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
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            ticket.priority === "High"
                              ? "destructive"
                              : ticket.priority === "Medium"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {ticket.priority}
                        </Badge>
                        <Badge variant={ticket.status === "Open" ? "outline" : "secondary"} className="text-xs">
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <TicketList tickets={filteredTickets} />
        </TabsContent>

        <TabsContent value="knowledge">
          <KnowledgeBase />
        </TabsContent>
      </Tabs>

      {/* New Ticket Form Modal */}
      {showNewTicketForm && <NewTicketForm onClose={() => setShowNewTicketForm(false)} />}
    </div>
  )
}
