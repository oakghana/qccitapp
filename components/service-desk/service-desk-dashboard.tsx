"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  Ticket,
  TrendingUp,
  MapPin,
  Monitor,
  Wifi,
  Smartphone,
  Printer,
} from "lucide-react"
import { NewTicketForm } from "./new-ticket-form"
import { TicketList } from "./ticket-list"
import { KnowledgeBase } from "./knowledge-base"
import { useAuth } from "@/lib/auth-context"

export function ServiceDeskDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showNewTicketForm, setShowNewTicketForm] = useState(false)
  const { canViewAllLocations, getUserLocation } = useAuth()

  const allTickets = [
    {
      id: "TKT-001",
      title: "Computer won't start - Head Office",
      category: "Hardware",
      priority: "High",
      status: "Open",
      location: "head_office",
      locationName: "Head Office - Accra",
      requester: "Kwame Asante",
      created: "2 hours ago",
    },
    {
      id: "TKT-002",
      title: "Email not working - Kumasi District",
      category: "Software",
      priority: "Medium",
      status: "In Progress",
      location: "kumasi",
      locationName: "Kumasi District Office",
      requester: "Ama Osei",
      created: "4 hours ago",
    },
    {
      id: "TKT-003",
      title: "Internet connection slow - Head Office",
      category: "Network",
      priority: "Low",
      status: "Open",
      location: "head_office",
      locationName: "Head Office - Accra",
      requester: "Abdul Rahman",
      created: "1 day ago",
    },
    {
      id: "TKT-004",
      title: "Printer not responding - Kumasi",
      category: "Hardware",
      priority: "Medium",
      status: "Resolved",
      location: "kumasi",
      locationName: "Kumasi District Office",
      requester: "Kofi Mensah",
      created: "3 days ago",
    },
  ]

  const filteredTickets = canViewAllLocations()
    ? allTickets
    : allTickets.filter((ticket) => ticket.location === getUserLocation())

  const recentTickets = filteredTickets.slice(0, 3)

  const stats = {
    totalTickets: filteredTickets.length,
    openTickets: filteredTickets.filter((t) => t.status === "Open").length,
    inProgress: filteredTickets.filter((t) => t.status === "In Progress").length,
    resolved: filteredTickets.filter((t) => t.status === "Resolved").length,
    avgResolutionTime: "2.3 hours",
    satisfaction: "94%",
  }

  const categoryIcons = {
    Hardware: Monitor,
    Software: Smartphone,
    Network: Wifi,
    Printer: Printer,
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
        <Button onClick={() => setShowNewTicketForm(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResolutionTime}</div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.satisfaction}</div>
            <p className="text-xs text-muted-foreground">User rating</p>
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
              <div className="space-y-4">
                {recentTickets.map((ticket) => {
                  const IconComponent = categoryIcons[ticket.category as keyof typeof categoryIcons] || Monitor
                  return (
                    <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{ticket.title}</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
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
                        >
                          {ticket.priority}
                        </Badge>
                        <Badge variant={ticket.status === "Open" ? "outline" : "secondary"}>{ticket.status}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <TicketList />
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
