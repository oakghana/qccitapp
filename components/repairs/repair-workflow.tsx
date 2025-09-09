"use client"

import { useState } from "react"
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

const mockRepairRequests: RepairRequest[] = [
  {
    id: "RR-2024-001",
    deviceId: "DL-2024-001",
    deviceName: "Dell Latitude 5520",
    requestedBy: "Kwame Asante",
    requestedDate: "2024-03-01",
    description: "Screen flickering and keyboard keys not responding properly",
    priority: "high",
    status: "pending",
    attachments: ["repair-form-001.pdf", "device-photos.jpg"],
    location: "head_office",
    locationName: "Head Office - Accra",
  },
  {
    id: "RR-2024-002",
    deviceId: "HP-2024-045",
    deviceName: "HP LaserJet Pro",
    requestedBy: "IT Department",
    requestedDate: "2024-02-28",
    description: "Paper jam mechanism broken, unable to print",
    priority: "medium",
    status: "with_provider",
    approvedBy: "John Doe",
    approvedDate: "2024-03-01",
    estimatedCompletion: "2024-03-15",
    attachments: ["repair-form-002.pdf"],
    location: "head_office",
    locationName: "Head Office - Accra",
    serviceProvider: "Natland Computers",
  },
  {
    id: "RR-2024-003",
    deviceId: "LD-2024-012",
    deviceName: "Lenovo ThinkCentre",
    requestedBy: "Ama Osei",
    requestedDate: "2024-02-25",
    description: "Computer randomly shutting down, possible power supply issue",
    priority: "urgent",
    status: "completed",
    approvedBy: "Kumasi IT Head",
    approvedDate: "2024-02-26",
    estimatedCompletion: "2024-03-10",
    attachments: ["repair-form-003.pdf", "diagnostic-report.pdf"],
    location: "kumasi",
    locationName: "Kumasi District Office",
    serviceProvider: "Natland Computers",
  },
  {
    id: "RR-2024-004",
    deviceId: "AC-2024-008",
    deviceName: "Acer Aspire Desktop",
    requestedBy: "Kofi Mensah",
    requestedDate: "2024-03-02",
    description: "Blue screen errors and system crashes during startup",
    priority: "high",
    status: "approved",
    approvedBy: "Kumasi IT Head",
    approvedDate: "2024-03-02",
    attachments: ["repair-form-004.pdf"],
    location: "kumasi",
    locationName: "Kumasi District Office",
  },
  {
    id: "RR-2024-005",
    deviceId: "KI-2024-003",
    deviceName: "Canon Printer MX490",
    requestedBy: "Sarah Mensah",
    requestedDate: "2024-03-03",
    description: "Ink cartridge not recognized, error messages on display",
    priority: "medium",
    status: "pending",
    attachments: ["repair-form-005.pdf"],
    location: "kaase_inland_port",
    locationName: "Kaase Inland Port",
  },
  {
    id: "RR-2024-006",
    deviceId: "CC-2024-007",
    deviceName: "HP EliteBook 840",
    requestedBy: "Cape Coast IT",
    requestedDate: "2024-03-04",
    description: "Battery not charging, power adapter issues",
    priority: "high",
    status: "approved",
    approvedBy: "Head Office IT Head",
    approvedDate: "2024-03-04",
    attachments: ["repair-form-006.pdf"],
    location: "cape_coast",
    locationName: "Cape Coast Office",
  },
]

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
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>(mockRepairRequests)
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const { user } = useAuth()

  const getFilteredRepairRequests = () => {
    if (user?.role === "it_head" && user?.location === "head_office") {
      return repairRequests
    }

    if (user?.role === "it_head" && user?.location !== "head_office") {
      return repairRequests.filter((request) => request.location === user.location)
    }

    if (user?.role === "admin") {
      return repairRequests
    }

    return repairRequests.filter((request) => request.location === user?.location)
  }

  const filteredRepairRequests = getFilteredRepairRequests()

  const getLocationDisplayText = () => {
    if (user?.role === "it_head" && user?.location === "head_office") {
      return "all locations"
    }

    if (user?.role === "admin") {
      return "all locations"
    }

    const locationNames = {
      head_office: "Head Office",
      kumasi: "Kumasi District Office",
      accra: "Accra Office",
      kaase_inland_port: "Kaase Inland Port",
      cape_coast: "Cape Coast Office",
    }

    return locationNames[user?.location as keyof typeof locationNames] || "your location"
  }

  const handleNewRequest = (newRequest: Omit<RepairRequest, "id" | "requestedDate" | "status" | "locationName">) => {
    const request: RepairRequest = {
      ...newRequest,
      id: `RR-2024-${String(repairRequests.length + 1).padStart(3, "0")}`,
      requestedDate: new Date().toISOString().split("T")[0],
      status: "pending",
      locationName: newRequest.location === "head_office" ? "Head Office - Accra" : "Kumasi District Office",
    }
    setRepairRequests([request, ...repairRequests])
    setNewRequestOpen(false)
  }

  const handleApproveRequest = (requestId: string) => {
    setRepairRequests(
      repairRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: "approved" as const,
              approvedBy: user?.name || "Current User",
              approvedDate: new Date().toISOString().split("T")[0],
            }
          : request,
      ),
    )
  }

  const handleRejectRequest = (requestId: string) => {
    setRepairRequests(
      repairRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: "rejected" as const,
              approvedBy: user?.name || "Current User",
              approvedDate: new Date().toISOString().split("T")[0],
            }
          : request,
      ),
    )
  }

  const pendingRequests = filteredRepairRequests.filter((r) => r.status === "pending")
  const activeRequests = filteredRepairRequests.filter((r) =>
    ["approved", "in_transit", "with_provider"].includes(r.status),
  )
  const completedRequests = filteredRepairRequests.filter((r) => ["completed", "rejected"].includes(r.status))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Repair Requests</h1>
          <p className="text-muted-foreground">
            {user?.role === "it_head" && user?.location === "head_office"
              ? "Manage device repair workflow and approvals across all locations"
              : user?.role === "admin"
                ? "Manage device repair workflow and approvals across all locations"
                : `Manage device repair workflow for ${getLocationDisplayText()}`}
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

      {/* Summary Cards */}
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
                : getLocationDisplayText()}
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
            <div className="text-2xl font-bold">8.5</div>
            <p className="text-xs text-muted-foreground">Days average</p>
          </CardContent>
        </Card>
      </div>

      {/* Repair Requests Tabs */}
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
                    : `No pending repair requests for ${getLocationDisplayText()}.`}
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
                  {user?.role === "admin"
                    ? "No devices are currently being repaired."
                    : `No devices from ${getLocationDisplayText()} are currently being repaired.`}
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

      {/* Repair Request Details Dialog */}
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
