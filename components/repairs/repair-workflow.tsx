"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { NewRepairRequestForm } from "./new-repair-request-form"
import { RepairRequestDetails } from "./repair-request-details"
import { Plus, Clock, CheckCircle, AlertTriangle, FileText, Calendar } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { canSeeAllLocations } from "@/lib/location-filter"

interface RepairRequest {
  id: string
  deviceId: string
  deviceName: string
  requestedBy: string
  requestedDate: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "approved" | "in_transit" | "with_provider" | "completed" | "rejected"
  approvedBy?: string
  approvedDate?: string
  estimatedCompletion?: string
  attachments: string[]
  location: "head_office" | "kumasi" | "accra" | "kaase_inland_port" | "cape_coast"
  locationName: string
  serviceProvider?: string
  notes?: string
}

const statusColors = {
  pending: "secondary",
  approved: "default",
  in_transit: "secondary",
  with_provider: "secondary",
  completed: "default",
  rejected: "destructive",
} as const

const priorityColors = {
  low: "outline",
  medium: "secondary",
  high: "secondary",
  urgent: "destructive",
} as const

const statusIcons = {
  pending: Clock,
  approved: CheckCircle,
  in_transit: AlertTriangle,
  with_provider: AlertTriangle,
  completed: CheckCircle,
  rejected: AlertTriangle,
}

export function RepairWorkflow() {
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([])
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    loadRepairRequests()
  }, [user])

  const loadRepairRequests = async () => {
    if (!user) return

    setLoading(true)
    console.log("[v0] Loading repair requests from database...")

    try {
      let query = supabase.from("repair_requests").select("*").order("created_at", { ascending: false })

      if (!canSeeAllLocations(user)) {
        query = query.eq("location", user.location)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error loading repair requests:", error)
        return
      }

      console.log("[v0] Loaded repair requests:", data?.length || 0)
      setRepairRequests(data || [])
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredRepairRequests = () => {
    return repairRequests
  }

  const filteredRepairRequests = getFilteredRepairRequests()

  const getLocationDisplayText = () => {
    if (user?.role === "admin") {
      return "all locations"
    }

    if (user?.role === "it_head" && user?.location === "head_office") {
      return "all locations"
    }

    if (user?.role === "it_head" || user?.role === "it_staff") {
      const locationNames = {
        head_office: "Head Office",
        kumasi: "Kumasi District Office",
        accra: "Accra Office",
        kaase_inland_port: "Kaase Inland Port",
        cape_coast: "Cape Coast Office",
      }
      return locationNames[user?.location as keyof typeof locationNames] || "your location"
    }

    return "your requests"
  }

  const handleNewRequest = async (
    newRequest: Omit<RepairRequest, "id" | "requestedBy" | "requestedDate" | "status" | "location" | "locationName">,
  ) => {
    const { data, error } = await supabase
      .from("repair_requests")
      .insert({
        ...newRequest,
        requested_by: user?.name || "Unknown User",
        location: user?.location || "head_office",
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating repair request:", error)
      return
    }

    loadRepairRequests()
    setNewRequestOpen(false)
  }

  const handleApproveRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("repair_requests")
      .update({
        status: "approved",
        approved_by: user?.name || "Current User",
        approved_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", requestId)

    if (error) {
      console.error("[v0] Error approving request:", error)
      return
    }

    loadRepairRequests()
  }

  const handleRejectRequest = async (requestId: string) => {
    const { error } = await supabase
      .from("repair_requests")
      .update({
        status: "rejected",
        approved_by: user?.name || "Current User",
        approved_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", requestId)

    if (error) {
      console.error("[v0] Error rejecting request:", error)
      return
    }

    loadRepairRequests()
  }

  const pendingRequests = filteredRepairRequests.filter((r) => r.status === "pending")
  const activeRequests = filteredRepairRequests.filter((r) =>
    ["approved", "in_transit", "with_provider"].includes(r.status),
  )
  const completedRequests = filteredRepairRequests.filter((r) => ["completed", "rejected"].includes(r.status))

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading repair requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Repair Requests</h1>
          <p className="text-muted-foreground">
            {user?.role === "admin"
              ? "Manage device repair workflow and approvals across all locations"
              : user?.role === "it_head" && user?.location === "head_office"
                ? "Manage device repair workflow and approvals across all locations"
                : user?.role === "it_head" || user?.role === "it_staff"
                  ? `Manage device repair workflow for ${getLocationDisplayText()}`
                  : "View and manage your repair requests"}
          </p>
        </div>
        <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Repair Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Repair Request</DialogTitle>
              <DialogDescription>Create a new repair request for an IT device</DialogDescription>
            </DialogHeader>
            <NewRepairRequestForm onSubmit={handleNewRequest} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {user?.role === "admin" || (user?.role === "it_head" && user?.location === "head_office")
                ? "All locations"
                : user?.role === "it_head" || user?.role === "it_staff"
                  ? getLocationDisplayText()
                  : "Your requests"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRequests.length}</div>
            <p className="text-xs text-muted-foreground">Currently being repaired</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRequests.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Repair Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedRequests.length > 0
                ? (
                    completedRequests.reduce((sum, req) => {
                      if (req.estimatedCompletion && req.approvedDate) {
                        const days =
                          Math.abs(new Date(req.estimatedCompletion).getTime() - new Date(req.approvedDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                        return sum + days
                      }
                      return sum
                    }, 0) / completedRequests.length
                  ).toFixed(1)
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground">Days average</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="active">In Progress ({activeRequests.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No pending requests</h3>
                <p className="text-muted-foreground text-center">
                  {user?.role === "admin" || (user?.role === "it_head" && user?.location === "head_office")
                    ? "All repair requests have been reviewed."
                    : user?.role === "it_head" || user?.role === "it_staff"
                      ? `No pending repair requests for ${getLocationDisplayText()}.`
                      : "You have no pending repair requests."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <RepairRequestCard
                  key={request.id}
                  request={request}
                  onViewDetails={() => {
                    setSelectedRequest(request)
                    setDetailsOpen(true)
                  }}
                  onApprove={() => handleApproveRequest(request.id)}
                  onReject={() => handleRejectRequest(request.id)}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No active repairs</h3>
                <p className="text-muted-foreground text-center">
                  {user?.role === "admin" || (user?.role === "it_head" && user?.location === "head_office")
                    ? "No devices are currently being repaired."
                    : user?.role === "it_head" || user?.role === "it_staff"
                      ? `No devices from ${getLocationDisplayText()} are currently being repaired.`
                      : "You have no devices currently being repaired."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeRequests.map((request) => (
                <RepairRequestCard
                  key={request.id}
                  request={request}
                  onViewDetails={() => {
                    setSelectedRequest(request)
                    setDetailsOpen(true)
                  }}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No completed repairs</h3>
                <p className="text-muted-foreground text-center">Completed repairs will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedRequests.map((request) => (
                <RepairRequestCard
                  key={request.id}
                  request={request}
                  onViewDetails={() => {
                    setSelectedRequest(request)
                    setDetailsOpen(true)
                  }}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Repair Request Details</DialogTitle>
            <DialogDescription>View complete information about this repair request</DialogDescription>
          </DialogHeader>
          {selectedRequest && <RepairRequestDetails request={selectedRequest} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface RepairRequestCardProps {
  request: RepairRequest
  onViewDetails: () => void
  onApprove?: () => void
  onReject?: () => void
  showActions: boolean
}

function RepairRequestCard({ request, onViewDetails, onApprove, onReject, showActions }: RepairRequestCardProps) {
  const StatusIcon = statusIcons[request.status]

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{request.deviceName}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>{request.id}</span>
              <span>•</span>
              <span>Requested by {request.requestedBy}</span>
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={priorityColors[request.priority]}>
              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
            </Badge>
            <Badge variant={statusColors[request.status]} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {request.status.replace("_", " ").charAt(0).toUpperCase() + request.status.replace("_", " ").slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-foreground">{request.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Location:</span>
              <p className="font-medium">{request.locationName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Requested:</span>
              <p className="font-medium">{new Date(request.requestedDate).toLocaleDateString()}</p>
            </div>
            {request.serviceProvider && (
              <div>
                <span className="text-muted-foreground">Service Provider:</span>
                <p className="font-medium">{request.serviceProvider}</p>
              </div>
            )}
            {request.estimatedCompletion && (
              <div>
                <span className="text-muted-foreground">Est. Completion:</span>
                <p className="font-medium">{new Date(request.estimatedCompletion).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {request.attachments.length > 0 && (
            <div>
              <span className="text-sm text-muted-foreground">Attachments:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {request.attachments.map((attachment, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {attachment}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <Button variant="outline" onClick={onViewDetails}>
              View Details
            </Button>
            {showActions && (
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={onReject}>
                  Reject
                </Button>
                <Button size="sm" onClick={onApprove}>
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
