"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle2, XCircle, Clock, Eye } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface ITRequisition {
  id: string
  requisition_number: string
  item_sn: string
  supplier_name: string
  items_required: string
  purpose: string
  requested_by: string
  department: string
  request_date: string
  status: string
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

export function ITFormsApprovalDashboard() {
  const [requisitions, setRequisitions] = useState<ITRequisition[]>([])
  const [filteredRequisitions, setFilteredRequisitions] = useState<ITRequisition[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequisition, setSelectedRequisition] = useState<ITRequisition | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState("")
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">("approve")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchRequisitions()
  }, [])

  useEffect(() => {
    filterRequisitions()
  }, [searchQuery, requisitions])

  const fetchRequisitions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/it-forms/requisitions?status=all")
      const data = await response.json()

      if (data.success) {
        setRequisitions(data.requisitions || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching requisitions:", error)
      toast({
        title: "Error",
        description: "Failed to load requisitions",
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
        req.requested_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.items_required.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredRequisitions(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string; icon: any }> = {
      draft: { variant: "secondary", label: "Draft", icon: Clock },
      pending: { variant: "default", label: "Awaiting HOD", icon: Clock },
      pending_department_head: { variant: "default", label: "Awaiting HOD", icon: Clock },
      pending_service_desk: { variant: "outline", label: "Service Desk Review", icon: CheckCircle2 },
      pending_it_head: { variant: "outline", label: "IT Head Review", icon: CheckCircle2 },
      pending_admin: { variant: "outline", label: "Admin Review", icon: CheckCircle2 },
      pending_store: { variant: "outline", label: "Ready for Store", icon: CheckCircle2 },
      issued: { variant: "default", label: "Issued", icon: CheckCircle2 },
      rejected_department_head: { variant: "destructive", label: "Rejected by HOD", icon: XCircle },
      rejected: { variant: "destructive", label: "Rejected", icon: XCircle },
    }

    const config = statusConfig[status] || { variant: "secondary", label: status.replace(/_/g, " "), icon: Clock }
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  const canApprove = (req: ITRequisition): boolean => {
    const userRole = user?.role || ""

    if (["draft", "pending_department_head", "pending"].includes(req.status)) {
      return false
    }
    if (req.status === "pending_service_desk") {
      return userRole === "service_desk_head" || userRole === "admin"
    }
    if (req.status === "pending_it_head") {
      return userRole === "it_head" || userRole === "admin"
    }
    if (req.status === "pending_admin") {
      return userRole === "admin"
    }
    if (req.status === "pending_store") {
      return userRole === "it_store_head"
    }

    return false
  }

  const handleApprove = (req: ITRequisition) => {
    setSelectedRequisition(req)
    setApprovalAction("approve")
    setApprovalNotes("")
    setIsApprovalDialogOpen(true)
  }

  const handleReject = (req: ITRequisition) => {
    setSelectedRequisition(req)
    setApprovalAction("reject")
    setApprovalNotes("")
    setIsApprovalDialogOpen(true)
  }

  const submitApproval = async () => {
    if (!selectedRequisition) return

    setIsSubmitting(true)
    try {
      const action = approvalAction === "approve" ? "approve" : "reject"
      const response = await fetch("/api/it-forms/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requisitionId: selectedRequisition.id,
          action,
          approvedBy: user?.full_name || "Unknown",
          approverRole: user?.role || "unknown",
          notes: approvalNotes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process approval")
      }

      toast({
        title: "Success",
        description: `Requisition ${approvalAction}d successfully`,
      })

      // Refresh the requisitions list
      fetchRequisitions()
      setIsApprovalDialogOpen(false)
      setSelectedRequisition(null)
    } catch (error: any) {
      console.error("[v0] Error submitting approval:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to process approval",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPendingCount = () => {
    return requisitions.filter((r) => ["pending", "pending_department_head", "pending_service_desk", "pending_it_head", "pending_admin", "pending_store", "draft"].includes(r.status)).length
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IT Forms Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage and approve IT equipment requisition requests
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requisitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requisitions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{getPendingCount()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requisitions.filter((r) => r.status === "issued").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requisitions</CardTitle>
          <CardDescription>View and manage all IT equipment requisitions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Search by requisition number, requester, department, or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredRequisitions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No requisitions found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRequisitions.map((req) => (
                  <div
                    key={req.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{req.requisition_number}</span>
                          {getStatusBadge(req.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Requested by: {req.requested_by} ({req.department})
                        </p>
                        <p className="text-sm">Items: {req.items_required.substring(0, 60)}...</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequisition(req)
                            setIsDetailDialogOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {canApprove(req) && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(req)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleReject(req)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRequisition?.requisition_number}</DialogTitle>
            <DialogDescription>
              Submitted on {selectedRequisition ? new Date(selectedRequisition.created_at).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedRequisition && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Requested By</Label>
                  <p className="font-medium">{selectedRequisition.requested_by}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{selectedRequisition.department}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>{getStatusBadge(selectedRequisition.status)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Request Date</Label>
                  <p className="font-medium">
                    {new Date(selectedRequisition.request_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Items Required</Label>
                <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                  {selectedRequisition.items_required}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Purpose</Label>
                <div className="bg-muted p-3 rounded text-sm whitespace-pre-wrap">
                  {selectedRequisition.purpose}
                </div>
              </div>

              {selectedRequisition.approval_chain && selectedRequisition.approval_chain.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Approval History</Label>
                  <div className="space-y-2">
                    {selectedRequisition.approval_chain.map((approval, idx) => (
                      <div key={idx} className="bg-muted p-3 rounded text-sm space-y-1">
                        <div className="font-medium">
                          {approval.action.toUpperCase()} by {approval.approver} ({approval.role})
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(approval.timestamp).toLocaleString()}
                        </div>
                        {approval.notes && <div>{approval.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "Approve" : "Reject"} Requisition
            </DialogTitle>
            <DialogDescription>
              {selectedRequisition?.requisition_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-3 rounded text-sm">
              <p className="font-medium mb-1">Items Requested:</p>
              <p className="text-muted-foreground">{selectedRequisition?.items_required}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                {approvalAction === "approve" ? "Approval" : "Rejection"} Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this decision..."
                className="min-h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitApproval}
              disabled={isSubmitting}
              variant={approvalAction === "approve" ? "default" : "destructive"}
            >
              {isSubmitting
                ? "Processing..."
                : `${approvalAction === "approve" ? "Approve" : "Reject"} Requisition`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
