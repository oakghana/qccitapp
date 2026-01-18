"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  FileText,
  Send,
  User,
  MapPin,
  Wrench,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

interface EscalatedTicket {
  id: string
  ticket_number: string
  title: string
  category: string
  priority: string
  status: string
  location: string
  requester: string
  escalation_reason: string
  escalation_date: string
  escalated_by: string
  escalated_by_location: string
  it_request_form_url?: string
}

interface ServiceProvider {
  id: string
  name: string
  email: string
  phone: string
  location: string
  specialization: string[]
}

export function ITHeadServiceProviderDashboard() {
  const { user } = useAuth()
  const [escalatedTickets, setEscalatedTickets] = useState<EscalatedTicket[]>([])
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<EscalatedTicket | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState("")
  const [assignmentNotes, setAssignmentNotes] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadEscalatedTickets(), loadServiceProviders()])
    } finally {
      setLoading(false)
    }
  }

  const loadEscalatedTickets = async () => {
    try {
      console.log("[v0] Loading escalated tickets for IT Head")

      // Query for escalated tickets that came to IT Head
      const { data, error } = await supabase
        .from("service_tickets")
        .select("*")
        .eq("status", "escalated")
        .eq("escalated_to", "it_head")
        .order("escalation_date", { ascending: false })

      if (error) {
        console.error("[v0] Error loading escalated tickets:", error)
        return
      }

      console.log("[v0] Loaded escalated tickets:", data?.length || 0)
      setEscalatedTickets(data || [])
    } catch (error) {
      console.error("[v0] Error loading escalated tickets:", error)
    }
  }

  const loadServiceProviders = async () => {
    try {
      console.log("[v0] Loading service providers")

      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.error("[v0] Error loading service providers:", error)
        return
      }

      console.log("[v0] Loaded service providers:", data?.length || 0)
      setServiceProviders(data || [])
    } catch (error) {
      console.error("[v0] Error loading service providers:", error)
    }
  }

  const handleAssignToServiceProvider = async () => {
    if (!selectedTicket || !selectedProvider) {
      alert("Please select a service provider")
      return
    }

    setIsAssigning(true)
    try {
      const provider = serviceProviders.find((sp) => sp.id === selectedProvider)
      if (!provider) return

      console.log("[v0] Assigning ticket to service provider:", provider.id, provider.name)

      // Update ticket to assign to service provider
      const { error: updateError } = await supabase
        .from("service_tickets")
        .update({
          status: "assigned_to_provider",
          assigned_to: provider.name,
          assigned_to_id: provider.id,
          assigned_at: new Date().toISOString(),
          assigned_by: user?.full_name || user?.name,
          assigned_by_role: "it_head",
        })
        .eq("id", selectedTicket.id)

      if (updateError) {
        console.error("[v0] Error assigning ticket:", updateError)
        alert("Failed to assign ticket")
        return
      }

      // Create repair request for service provider
      const { error: repairError } = await supabase
        .from("repair_requests")
        .insert({
          ticket_id: selectedTicket.id,
          device_id: selectedTicket.id, // Linking to device
          issue_description: selectedTicket.title,
          priority: selectedTicket.priority,
          service_provider_id: provider.id,
          service_provider_name: provider.name,
          location: selectedTicket.location,
          requested_by: selectedTicket.requester,
          status: "assigned",
          assigned_at: new Date().toISOString(),
          notes: assignmentNotes,
        })

      if (repairError) {
        console.warn("[v0] Warning creating repair request:", repairError)
      }

      // Create ticket update
      await supabase
        .from("service_ticket_updates")
        .insert({
          ticket_id: selectedTicket.id,
          update_type: "assignment",
          old_status: "escalated",
          new_status: "assigned_to_provider",
          new_assignee: provider.name,
          notes: `Assigned to service provider: ${provider.name} (${provider.phone}). ${assignmentNotes}`,
          created_by: user?.id,
          created_by_name: user?.full_name || user?.name,
        })

      console.log("[v0] Ticket assigned to service provider successfully")
      alert(`Ticket assigned to ${provider.name}. They will contact the requester to collect the device.`)
      
      setAssignDialogOpen(false)
      setSelectedTicket(null)
      setSelectedProvider("")
      setAssignmentNotes("")
      await loadData()
    } catch (error) {
      console.error("[v0] Error assigning ticket:", error)
      alert("An error occurred while assigning the ticket")
    } finally {
      setIsAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4 mx-auto animate-spin" />
          <p>Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">IT Head Dashboard</h2>
        <p className="text-muted-foreground mt-2">Assign escalated tickets to service providers for repair</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{escalatedTickets.length}</div>
            <p className="text-xs text-muted-foreground">Tickets awaiting assignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceProviders.length}</div>
            <p className="text-xs text-muted-foreground">Active service providers</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Assignment ({escalatedTickets.length})</TabsTrigger>
          <TabsTrigger value="providers">Service Providers ({serviceProviders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {escalatedTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tickets awaiting assignment</p>
              </CardContent>
            </Card>
          ) : (
            escalatedTickets.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-blue-600" />
                        {ticket.title}
                      </CardTitle>
                      <CardDescription>Ticket #{ticket.ticket_number}</CardDescription>
                    </div>
                    <Badge>{ticket.priority.toUpperCase()}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Category</p>
                      <p className="font-medium">{ticket.category}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {ticket.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Requester</p>
                      <p className="font-medium">{ticket.requester}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Escalated From</p>
                      <p className="font-medium">{ticket.escalated_by_location}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Issue Description</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">{ticket.escalation_reason}</p>
                  </div>

                  {ticket.it_request_form_url && (
                    <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                      <a href={ticket.it_request_form_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download IT Request Form
                      </a>
                    </Button>
                  )}

                  <Dialog open={assignDialogOpen && selectedTicket?.id === ticket.id} onOpenChange={setAssignDialogOpen}>
                    <Button
                      onClick={() => setSelectedTicket(ticket)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Assign to Service Provider
                    </Button>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Assign to Service Provider</DialogTitle>
                        <DialogDescription>
                          Select a service provider to handle this repair request
                        </DialogDescription>
                      </DialogHeader>
                      {selectedTicket && (
                        <div className="space-y-4">
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              The service provider will be contacted to collect the device from the requester
                            </AlertDescription>
                          </Alert>

                          <div>
                            <Label htmlFor="provider">Service Provider</Label>
                            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a service provider..." />
                              </SelectTrigger>
                              <SelectContent>
                                {serviceProviders.map((provider) => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      <span>{provider.name}</span>
                                      <span className="text-xs text-muted-foreground">({provider.phone})</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {selectedProvider && (
                            <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded border border-green-200 dark:border-green-800">
                              {serviceProviders.find((p) => p.id === selectedProvider) && (
                                <div className="space-y-2 text-sm">
                                  <p className="font-medium">
                                    {serviceProviders.find((p) => p.id === selectedProvider)?.name}
                                  </p>
                                  <p className="text-green-700 dark:text-green-300">
                                    {serviceProviders.find((p) => p.id === selectedProvider)?.email}
                                  </p>
                                  <p className="text-green-700 dark:text-green-300">
                                    {serviceProviders.find((p) => p.id === selectedProvider)?.phone}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          <div>
                            <Label htmlFor="assignmentNotes">Additional Instructions (Optional)</Label>
                            <Textarea
                              id="assignmentNotes"
                              placeholder="Add any special instructions or notes for the service provider..."
                              value={assignmentNotes}
                              onChange={(e) => setAssignmentNotes(e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAssignToServiceProvider}
                              disabled={isAssigning || !selectedProvider}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {isAssigning ? "Assigning..." : "Assign & Notify"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="providers" className="space-y-4 mt-4">
          {serviceProviders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No service providers available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {serviceProviders.map((provider) => (
                <Card key={provider.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {provider.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Email:</span> {provider.email}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Phone:</span> {provider.phone}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Location:</span> {provider.location}
                    </p>
                    <div>
                      <span className="text-muted-foreground">Specialization:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(provider.specialization || []).map((spec, idx) => (
                          <Badge key={idx} variant="secondary">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
