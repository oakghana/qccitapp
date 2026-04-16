"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle, Eye, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ApprovalTracker } from "./approval-tracker"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ITRequisition {
  id: string
  requisition_number: string
  items_required: string
  purpose: string
  requested_by: string
  requested_by_email: string
  department: string
  department_head: string
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

export function DepartmentHeadApprovalModule() {
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
  const [filterTab, setFilterTab] = useState<"pending" | "approved" | "rejected" | "all">("pending")
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchRequisitions()
  }, [])

  useEffect(() => {
    filterRequisitions()
  }, [searchQuery, requisitions, filterTab])

  const fetchRequisitions = async () => {
    try {
      setLoading(true)
      // Fetch requisitions that need department head approval
      const response = await fetch("/api/it-forms/requisitions?status=pending_department_head")
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
    let filtered = requisitions

    // Filter by tab
    if (filterTab === "pending") {
      filtered = filtered.filter((req) => !req.department_head_approved && !req.department_head_notes)
    } else if (filterTab === "approved") {
      filtered = filtered.filter((req) => req.department_head_approved)
    } else if (filterTab === "rejected") {
      filtered = filtered.filter((req) => req.department_head_approved === false)
    }

    // Filter by search
    filtered = filtered.filter(
      (req) =>
        req.requisition_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.requested_by.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.items_required.toLowerCase().includes(searchQuery.toLowerCase())
    )

    setFilteredRequisitions(filtered)
  }

  const canApprove = (req: ITRequisition): boolean => {
    // Check if user is the department head or admin
    return !req.department_head_approved && !req.department_head_notes
  }

  const buildApprovalStages = (req: ITRequisition): any[] => {
    return [
      {
        stage: "Department Head Review",
        role: "Department Head",
        status: req.department_head_approved_by ? "completed" : req.department_head_notes ? "rejected" : "pending",
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
    if (!selectedRequisition || !approvalNotes.trim()) {
      toast({
        title: "Required",
        description: "Please add notes for your approval/rejection",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/it-forms/department-head-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requisitionId: selectedRequisition.id,
          action: approvalAction,
          approvedBy: user?.full_name || user?.email || "Unknown",
          notes: approvalNotes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process approval")
      }

      toast({
        title: "Success",
        description: `Requisition ${approvalAction === "approve" ? "approved" : "rejected"} successfully`,
      })

      // Refresh the requisitions list
      fetchRequisitions()
      setIsApprovalDialogOpen(false)
      setSelectedRequisition(null)
      setApprovalNotes("")
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

  const getPendingCount = () => requisitions.filter((r) => !r.department_head_approved && !r.department_head_notes).length
  const getApprovedCount = () => requisitions.filter((r) => r.department_head_approved).length
  const getRejectedCount = () => requisitions.filter((r) => r.department_head_approved === false).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Department Head Approval</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve IT equipment requisitions from your department
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{getPendingCount()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{getApprovedCount()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{getRejectedCount()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{requisitions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Requisition Requests</CardTitle>
              <CardDescription>Review requests needing your approval</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Input
              placeholder="Search by requisition number, requester, or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />

            <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as any)}>
              <TabsList>
                <TabsTrigger value="pending">Pending ({getPendingCount()})</TabsTrigger>
                <TabsTrigger value="approved">Approved ({getApprovedCount()})</TabsTrigger>
                <TabsTrigger value="rejected">Rejected ({getRejectedCount()})</TabsTrigger>
                <TabsTrigger value="all">All ({requisitions.length})</TabsTrigger>
              </TabsList>

              <TabsContent value={filterTab} className="mt-4">
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
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{req.requisition_number}</span>
                              <Badge variant={canApprove(req) ? "default" : "secondary"} className="text-xs">
                                {req.department_head_approved
                                  ? "Approved by HOD"
                                  : req.department_head_notes
                                  ? "Rejected by HOD"
                                  : "Awaiting HOD Review"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Requested by: <span className="font-medium">{req.requested_by}</span> • Department:{" "}
                              <span className="font-medium">{req.department}</span>
                            </p>
                            <p className="text-sm">Items: {req.items_required.substring(0, 80)}...</p>
                            {req.purpose && (
                              <p className="text-sm text-muted-foreground">Purpose: {req.purpose.substring(0, 80)}...</p>
                            )}
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
                                  className="bg-green-600 hover:bg-green-700"
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
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog with Approval Tracker */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRequisition?.requisition_number}</DialogTitle>
            <DialogDescription>
              Submitted on {selectedRequisition ? new Date(selectedRequisition.created_at).toLocaleDateString() : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedRequisition && (
            <div className="space-y-6">
              {/* Request Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Requested By</Label>
                    <p className="font-medium">{selectedRequisition.requested_by}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium text-sm">{selectedRequisition.requested_by_email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Department</Label>
                    <p className="font-medium">{selectedRequisition.department}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Request Date</Label>
                    <p className="font-medium">
                      {new Date(selectedRequisition.request_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Items Required</Label>
                  <p className="font-medium text-sm whitespace-pre-wrap">{selectedRequisition.items_required}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Purpose</Label>
                  <p className="font-medium text-sm">{selectedRequisition.purpose}</p>
                </div>
              </div>

              {/* Approval Tracker */}
              <div>
                <h3 className="font-semibold mb-3">Approval Status</h3>
                <ApprovalTracker stages={buildApprovalStages(selectedRequisition)} currentStatus={selectedRequisition.status} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequisition?.requisition_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">
                {approvalAction === "approve" ? "Approval Notes" : "Rejection Reason"} *
              </Label>
              <Textarea
                id="notes"
                placeholder={approvalAction === "approve" 
                  ? "Add any notes about your approval..."
                  : "Explain why you're rejecting this request..."
                }
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="min-h-24 resize-none"
              />
            </div>

            {approvalAction === "reject" && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-300">
                  The requester will be notified and can revise their request
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitApproval}
              disabled={isSubmitting || !approvalNotes.trim()}
              variant={approvalAction === "approve" ? "default" : "destructive"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : approvalAction === "approve" ? (
                "Approve Request"
              ) : (
                "Reject Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
