"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, Eye, Loader2, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ApprovalTracker } from "./approval-tracker"

interface ITRequisition {
  id: string
  requisition_number: string
  items_required: string
  purpose: string
  requested_by: string
  department: string
  request_date: string
  status: string
  department_head_approved?: boolean
  department_head_approved_by?: string
  department_head_approved_at?: string
  department_head_notes?: string
  service_desk_approved?: boolean
  it_head_approved?: boolean
  admin_approved?: boolean
  store_head_approved?: boolean
  approval_chain: Array<{
    approver: string
    role: string
    action: string
    notes: string
    timestamp: string
  }>
  created_at: string
  updated_at: string
}

export function RequestStatusTracker() {
  const [requisitions, setRequisitions] = useState<ITRequisition[]>([])
  const [filteredRequisitions, setFilteredRequisitions] = useState<ITRequisition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequisition, setSelectedRequisition] = useState<ITRequisition | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchMyRequisitions()
  }, [])

  useEffect(() => {
    filterRequisitions()
  }, [searchQuery, requisitions])

  const fetchMyRequisitions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/it-forms/my-requisitions?userId=${user?.id}`)
      const data = await response.json()

      if (data.success) {
        setRequisitions(data.requisitions || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching requisitions:", error)
      toast({
        title: "Error",
        description: "Failed to load your requisitions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterRequisitions = () => {
    const filtered = requisitions.filter(
      (req) =>
        req.requisition_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.items_required.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredRequisitions(filtered)
  }

  const buildApprovalStages = (req: ITRequisition): any[] => {
    return [
      {
        stage: "Department Head Review",
        role: "Department Head",
        status: req.department_head_approved_by 
          ? (req.department_head_approved ? "completed" : "rejected")
          : "pending",
        approver: req.department_head_approved_by,
        timestamp: req.department_head_approved_at,
        notes: req.department_head_notes,
      },
      {
        stage: "IT Service Desk Processing",
        role: "IT Service Desk",
        status: req.service_desk_approved ? "completed" : "pending",
      },
      {
        stage: "IT Head Review",
        role: "IT Head",
        status: req.it_head_approved ? "completed" : "pending",
      },
      {
        stage: "Admin Approval",
        role: "Admin",
        status: req.admin_approved ? "completed" : "pending",
      },
      {
        stage: "Store Head Issuance",
        role: "IT Store Head",
        status: req.store_head_approved ? "completed" : "pending",
      },
    ]
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      pending_department_head: { variant: "default", label: "Awaiting HOD" },
      pending_service_desk: { variant: "default", label: "Processing" },
      pending_it_head: { variant: "default", label: "Awaiting IT Head" },
      pending_admin: { variant: "default", label: "Awaiting Admin" },
      pending_store: { variant: "default", label: "Ready for Issue" },
      approved: { variant: "default", label: "Approved" },
      issued: { variant: "default", label: "Issued" },
      rejected_department_head: { variant: "destructive", label: "Rejected by HOD" },
    }

    const config = statusConfig[status] || { variant: "secondary", label: status }
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  const getNextStep = (req: ITRequisition) => {
    if (!req.department_head_approved_by) return "Waiting for Department Head approval"
    if (req.department_head_approved === false) return "Your request was rejected"
    if (!req.service_desk_approved) return "Being processed by IT Service Desk"
    if (!req.it_head_approved) return "Awaiting IT Head review"
    if (!req.admin_approved) return "Awaiting Admin approval"
    if (!req.store_head_approved) return "Ready for store issuance"
    return "Request completed"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Requisition Requests</h1>
        <p className="text-muted-foreground mt-2">
          Track the approval status of your IT equipment requisitions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requisitions.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requisitions.filter((r) => !["issued", "rejected_department_head"].includes(r.status)).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requisitions.filter((r) => r.status === "issued").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requisitions List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
          <CardDescription>View and track the status of all your IT equipment requisitions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by requisition number or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <Button variant="outline" size="sm" onClick={fetchMyRequisitions}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRequisitions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No requisitions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequisitions.map((req) => (
                <div
                  key={req.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-all hover:shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{req.requisition_number}</span>
                        {getStatusBadge(req.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {new Date(req.request_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm">Items: {req.items_required.substring(0, 80)}...</p>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Next: {getNextStep(req)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRequisition(req)
                        setIsDetailDialogOpen(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Track
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog with Tracker */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRequisition?.requisition_number}</DialogTitle>
            <DialogDescription>
              Submitted on {selectedRequisition ? new Date(selectedRequisition.created_at).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedRequisition && (
            <div className="space-y-6">
              {/* Request Details */}
              <div className="space-y-2">
                <h3 className="font-semibold">Request Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <p className="font-medium">{selectedRequisition.department}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p>{getStatusBadge(selectedRequisition.status)}</p>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Items Required:</span>
                <p className="text-sm whitespace-pre-wrap mt-1">{selectedRequisition.items_required}</p>
              </div>

              {selectedRequisition.purpose && (
                <div>
                  <span className="text-sm text-muted-foreground">Purpose:</span>
                  <p className="text-sm mt-1">{selectedRequisition.purpose}</p>
                </div>
              )}

              {/* Approval Tracker */}
              <div>
                <h3 className="font-semibold mb-3">Approval Timeline</h3>
                <ApprovalTracker 
                  stages={buildApprovalStages(selectedRequisition)} 
                  currentStatus={selectedRequisition.status} 
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
