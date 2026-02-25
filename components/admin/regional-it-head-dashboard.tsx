"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
  Phone,
  UserCheck,
  AlertCircle,
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
  escalated_by_role: string
  escalated_by_location: string
  it_request_form_url?: string
}

export function RegionalITHeadDashboard() {
  const { user } = useAuth()
  const [escalatedTickets, setEscalatedTickets] = useState<EscalatedTicket[]>([])
  const [unassignedTickets, setUnassignedTickets] = useState<any[]>([])
  const [myAssignedTickets, setMyAssignedTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<EscalatedTicket | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)
  const [selfAssigningId, setSelfAssigningId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadAllTickets()
  }, [])

  const loadEscalatedTickets = async () => {
    try {
      setLoading(true)
      console.log("[v0] Loading escalated tickets for regional IT head:", user?.location)

      // Query for escalated tickets that came to this regional IT head
      const { data, error } = await supabase
        .from("service_tickets")
        .select("*")
        .eq("status", "escalated")
        .eq("escalated_to", "regional_it_head")
        .eq("location", user?.location)
        .order("escalation_date", { ascending: false })

      if (error) {
        console.error("[v0] Error loading escalated tickets:", error)
        return
      }

      console.log("[v0] Loaded escalated tickets:", data?.length || 0)
      setEscalatedTickets(data || [])
    } catch (error) {
      console.error("[v0] Error loading escalated tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllTickets = async () => {
    try {
      setLoading(true)
      
      // Load escalated tickets
      await loadEscalatedTickets()
      
      // Load unassigned tickets in this region
      const { data: unassigned } = await supabase
        .from("service_tickets")
        .select("*")
        .eq("status", "open")
        .is("assigned_to", null)
        .eq("location", user?.location)
        .order("created_at", { ascending: false })

      setUnassignedTickets(unassigned || [])

      // Load tickets assigned to this regional IT head
      const { data: myTickets } = await supabase
        .from("service_tickets")
        .select("*")
        .eq("assigned_to", user?.id)
        .order("created_at", { ascending: false })

      setMyAssignedTickets(myTickets || [])
    } catch (error) {
      console.error("[v0] Error loading all tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelfAssign = async (ticketId: string, ticketData: any) => {
    if (!user?.id) return

    setSelfAssigningId(ticketId)
    try {
      const response = await fetch("/api/service-tickets/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          assigneeId: user.id,
          assignee: user.full_name || user.name || user.email || "Regional IT Head",
          assigneeEmail: user.email,
          assigneePhone: user.phone || "",
          priority: ticketData.priority?.toLowerCase() || "medium",
          dueDate: "",
          instructions: "Self-assigned by Regional IT Head",
          assignedBy: user.full_name || user.name || user.email || "Regional IT Head",
          assignedById: user.id,
          notifyEmail: false,
          notifySMS: false,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        alert(result.error || "Failed to self-assign ticket")
        return
      }

      alert("Ticket has been assigned to you successfully")
      await loadAllTickets()
    } catch (error) {
      console.error("[v0] Error self-assigning ticket:", error)
      alert("An error occurred while self-assigning the ticket")
    } finally {
      setSelfAssigningId(null)
    }
  }

  const handleForwardToITHead = async (approved: boolean) => {
    if (!selectedTicket) return

    setIsReviewing(true)
    try {
      console.log("[v0] Forwarding ticket to IT Head:", selectedTicket.id, "Approved:", approved)

      const response = await fetch("/api/service-tickets/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          escalateTo: "it_head",
          escalationReason: approved
            ? `Approved by Regional IT Head. ${reviewNotes}`
            : `Reviewed by Regional IT Head. ${reviewNotes}`,
          currentAssignedUser: user?.full_name || user?.name,
          currentUserRole: "regional_it_head",
          currentUserLocation: user?.location,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || "Failed to forward ticket")
        return
      }

      console.log("[v0] Ticket forwarded successfully")
      alert("Ticket forwarded to IT Head for service provider assignment")
      
      setReviewDialogOpen(false)
      setSelectedTicket(null)
      setReviewNotes("")
      await loadEscalatedTickets()
    } catch (error) {
      console.error("[v0] Error forwarding ticket:", error)
      alert("An error occurred while forwarding the ticket")
    } finally {
      setIsReviewing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4 mx-auto animate-spin" />
          <p>Loading escalated tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Regional IT Head Dashboard</h2>
        <p className="text-muted-foreground mt-2">Review and forward escalated tickets to IT Head for service provider assignment</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Review ({escalatedTickets.length})</TabsTrigger>
          <TabsTrigger value="forwarded">All Forwarded</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {escalatedTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No escalated tickets awaiting review</p>
              </CardContent>
            </Card>
          ) : (
            escalatedTickets.map((ticket) => (
              <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <ArrowUp className="h-5 w-5 text-orange-600" />
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
                      <p className="text-muted-foreground">Escalated From</p>
                      <p className="font-medium">{ticket.escalated_by} ({ticket.escalated_by_location})</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Requester</p>
                      <p className="font-medium">{ticket.requester}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{new Date(ticket.escalation_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Escalation Reason</p>
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

                  <Dialog open={reviewDialogOpen && selectedTicket?.id === ticket.id} onOpenChange={setReviewDialogOpen}>
                    <Button
                      onClick={() => setSelectedTicket(ticket)}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Review & Forward
                    </Button>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Forward to IT Head</DialogTitle>
                        <DialogDescription>
                          Review and forward this ticket to IT Head for service provider assignment
                        </DialogDescription>
                      </DialogHeader>
                      {selectedTicket && (
                        <div className="space-y-4">
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Once forwarded, IT Head will contact the service provider to pick up the device for repair
                            </AlertDescription>
                          </Alert>

                          <div>
                            <Label htmlFor="reviewNotes">Additional Notes for IT Head (Optional)</Label>
                            <Textarea
                              id="reviewNotes"
                              placeholder="Add any notes or recommendations..."
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleForwardToITHead(true)}
                              disabled={isReviewing}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {isReviewing ? "Forwarding..." : "Forward to IT Head"}
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

        <TabsContent value="forwarded" className="space-y-4 mt-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Forwarded tickets will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
