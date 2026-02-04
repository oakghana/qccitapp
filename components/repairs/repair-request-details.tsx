import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, MapPin, FileText, Clock, CheckCircle } from "lucide-react"
import { REQUEST_PRIORITY_COLORS, REQUEST_STATUS_COLORS, type RequestStatus } from "@/lib/repair-constants"

interface RepairRequest {
  id: string
  deviceId: string
  deviceName: string
  requestedBy: string
  requestedDate: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  status: RequestStatus
  approvedBy?: string
  approvedDate?: string
  estimatedCompletion?: string
  attachments: string[]
  location: string
  serviceProvider?: string
  notes?: string
}

interface RepairRequestDetailsProps {
  request: RepairRequest
}

export function RepairRequestDetails({ request }: RepairRequestDetailsProps) {
  const getStatusTimeline = () => {
    const timeline = [
      {
        status: "pending",
        label: "Request Submitted",
        date: request.requestedDate,
        completed: true,
      },
    ]

    if (request.status !== "pending" && request.status !== "rejected") {
      timeline.push({
        status: "approved",
        label: "Request Approved",
        date: request.approvedDate || "",
        completed: true,
      })
    }

    if (request.status === "in_transit") {
      timeline.push({
        status: "in_transit",
        label: "Device in Transit",
        date: "",
        completed: true,
      })
    }

    if (request.status === "with_provider" || request.status === "completed") {
      timeline.push({
        status: "with_provider",
        label: "With Service Provider",
        date: "",
        completed: true,
      })
    }

    if (request.status === "completed") {
      timeline.push({
        status: "completed",
        label: "Repair Completed",
        date: "",
        completed: true,
      })
    }

    if (request.status === "rejected") {
      timeline.push({
        status: "rejected",
        label: "Request Rejected",
        date: request.approvedDate || "",
        completed: true,
      })
    }

    return timeline
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{request.deviceName}</h3>
          <div className="flex items-center space-x-2">
            <Badge variant={REQUEST_PRIORITY_COLORS[request.priority]}>
              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
            </Badge>
            <Badge variant={REQUEST_STATUS_COLORS[request.status]}>
              {request.status.replace("_", " ").charAt(0).toUpperCase() + request.status.replace("_", " ").slice(1)}
            </Badge>
          </div>
        </div>
        <p className="text-muted-foreground">Request ID: {request.id}</p>
      </div>

      <Separator />

      {/* Request Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Request Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Requested By</p>
                <p className="font-medium">{request.requestedBy}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date Submitted</p>
                <p className="font-medium">{new Date(request.requestedDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Device ID</p>
                <p className="font-medium">{request.deviceId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{request.location}</p>
              </div>
            </div>
            {request.approvedBy && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Approved By</p>
                  <p className="font-medium">{request.approvedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Approval Date</p>
                  <p className="font-medium">
                    {request.approvedDate ? new Date(request.approvedDate).toLocaleDateString() : "-"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Service Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {request.serviceProvider && (
              <div>
                <p className="text-sm text-muted-foreground">Service Provider</p>
                <p className="font-medium">{request.serviceProvider}</p>
              </div>
            )}
            {request.estimatedCompletion && (
              <div>
                <p className="text-sm text-muted-foreground">Estimated Completion</p>
                <p className="font-medium">{new Date(request.estimatedCompletion).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <p className="font-medium">
                {request.status.replace("_", " ").charAt(0).toUpperCase() + request.status.replace("_", " ").slice(1)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problem Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Problem Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{request.description}</p>
        </CardContent>
      </Card>

      {/* Attachments */}
      {request.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {request.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{attachment}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getStatusTimeline().map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    item.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.completed ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.label}</p>
                  {item.date && (
                    <p className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
