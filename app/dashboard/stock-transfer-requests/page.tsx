"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  RefreshCcw,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { FormNavigation } from "@/components/ui/form-navigation"

interface TransferRequest {
  id: string
  request_number: string
  item_id: string
  item_name: string
  item_code: string
  central_stock_available: number
  requested_quantity: number
  approved_quantity?: number
  requested_by: string
  requesting_location: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  notes?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

const statusConfig = {
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  approved: { icon: CheckCircle, color: "bg-green-100 text-green-800", label: "Approved" },
  rejected: { icon: XCircle, color: "bg-red-100 text-red-800", label: "Rejected" },
  cancelled: { icon: XCircle, color: "bg-gray-100 text-gray-800", label: "Cancelled" },
}

export default function StockTransferRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<TransferRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  
  // Approval dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null)
  const [approvedQuantity, setApprovedQuantity] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState("")
  const [actionSuccess, setActionSuccess] = useState("")

  // Check if user can approve requests (Admin only)
  const canApprove = user?.role === "admin"
  // Check if user can create requests (IT Store Head only)
  const canCreateRequest = user?.role === "it_store_head"
  const isRegionalHead = user?.role === "regional_it_head"

  useEffect(() => {
    loadRequests()
  }, [activeTab])

  async function loadRequests() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: activeTab,
        location: user?.location || "",
        userRole: user?.role || "",
      })

      const response = await fetch(`/api/store/stock-transfer-requests?${params}`)
      if (response.ok) {
        const { requests: data } = await response.json()
        setRequests(data || [])
      }
    } catch (error) {
      console.error("[v0] Error loading transfer requests:", error)
    } finally {
      setLoading(false)
    }
  }

  function openApproveDialog(request: TransferRequest, action: "approve" | "reject") {
    setSelectedRequest(request)
    setApprovedQuantity(request.requested_quantity.toString())
    setRejectionReason("")
    setActionError("")
    setActionSuccess("")
    setApproveDialogOpen(true)
  }

  async function handleApprove() {
    if (!selectedRequest) return

    const qty = parseInt(approvedQuantity)
    if (isNaN(qty) || qty <= 0 || qty > selectedRequest.requested_quantity) {
      setActionError(`Please enter a valid quantity (1 - ${selectedRequest.requested_quantity})`)
      return
    }

    setActionLoading(true)
    setActionError("")

    try {
      const response = await fetch("/api/store/stock-transfer-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: "approve",
          approvedQuantity: qty,
          approvedBy: user?.full_name || user?.name,
          userRole: user?.role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setActionError(result.error || "Failed to approve request")
        return
      }

      setActionSuccess(result.message || "Request approved successfully!")
      setTimeout(() => {
        setApproveDialogOpen(false)
        loadRequests()
      }, 2000)
    } catch (error) {
      console.error("[v0] Error approving request:", error)
      setActionError("Failed to approve request")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!selectedRequest) return

    if (!rejectionReason.trim()) {
      setActionError("Please provide a reason for rejection")
      return
    }

    setActionLoading(true)
    setActionError("")

    try {
      const response = await fetch("/api/store/stock-transfer-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: "reject",
          approvedBy: user?.full_name || user?.name,
          userRole: user?.role,
          rejectionReason: rejectionReason,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setActionError(result.error || "Failed to reject request")
        return
      }

      setActionSuccess("Request rejected")
      setTimeout(() => {
        setApproveDialogOpen(false)
        loadRequests()
      }, 2000)
    } catch (error) {
      console.error("[v0] Error rejecting request:", error)
      setActionError("Failed to reject request")
    } finally {
      setActionLoading(false)
    }
  }

  const pendingCount = requests.filter(r => r.status === "pending").length

  return (
    <div className="space-y-6">
      <FormNavigation currentPage="/dashboard/stock-transfer-requests" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Stock Transfer Requests
          </h2>
          <p className="text-muted-foreground">
            {canApprove 
              ? "Review and approve stock transfer requests (Central Stores → Head Office)" 
              : canCreateRequest
                ? "Request stock transfers from Central Stores to Head Office"
                : "View stock transfer requests"}
          </p>
          {!canApprove && !canCreateRequest && (
            <p className="text-xs text-amber-600 mt-1">
              Note: Only IT Store Head can request transfers, and only Admin can approve them.
            </p>
          )}
        </div>
        <Button variant="outline" onClick={loadRequests}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-yellow-500">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p>Loading requests...</p>
              </CardContent>
            </Card>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No {activeTab !== "all" ? activeTab : ""} requests found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => {
                const status = statusConfig[request.status]
                const StatusIcon = status.icon

                return (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                            <span className="font-mono text-sm text-muted-foreground">
                              {request.request_number}
                            </span>
                          </div>
                          
                          <h3 className="font-semibold text-lg">{request.item_name}</h3>
                          <p className="text-sm text-muted-foreground">Code: {request.item_code}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Requested By:</span>
                              <p className="font-medium">{request.requested_by}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Location:</span>
                              <p className="font-medium">{request.requesting_location}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Quantity:</span>
                              <p className="font-medium">
                                {request.approved_quantity ?? request.requested_quantity} units
                                {request.approved_quantity && request.approved_quantity !== request.requested_quantity && (
                                  <span className="text-muted-foreground ml-1">
                                    (requested: {request.requested_quantity})
                                  </span>
                                )}
                              </p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Date:</span>
                              <p className="font-medium">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {request.notes && (
                            <p className="text-sm mt-2 text-muted-foreground">
                              <span className="font-medium">Notes:</span> {request.notes}
                            </p>
                          )}

                          {request.rejection_reason && (
                            <p className="text-sm mt-2 text-red-600">
                              <span className="font-medium">Rejection Reason:</span> {request.rejection_reason}
                            </p>
                          )}

                          {request.approved_by && (
                            <p className="text-sm mt-2 text-green-600">
                              <span className="font-medium">
                                {request.status === "approved" ? "Approved" : "Processed"} by:
                              </span> {request.approved_by}
                              {request.approved_at && ` on ${new Date(request.approved_at).toLocaleDateString()}`}
                            </p>
                          )}
                        </div>

                        {canApprove && request.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => openApproveDialog(request, "approve")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedRequest(request)
                                setRejectionReason("")
                                setActionError("")
                                setApproveDialogOpen(true)
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve/Reject Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Transfer Request</DialogTitle>
            <DialogDescription>
              Request #{selectedRequest?.request_number}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium">{selectedRequest.item_name}</h4>
                <p className="text-sm text-muted-foreground">
                  Requested: {selectedRequest.requested_quantity} units for {selectedRequest.requesting_location}
                </p>
                <p className="text-sm text-muted-foreground">
                  Central Stock Available: {selectedRequest.central_stock_available} units
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approved-qty">Quantity to Approve</Label>
                <Input
                  id="approved-qty"
                  type="number"
                  min="1"
                  max={selectedRequest.requested_quantity}
                  value={approvedQuantity}
                  onChange={(e) => setApprovedQuantity(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  You can approve a partial quantity if needed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  rows={2}
                />
              </div>

              {actionError && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {actionError}
                </div>
              )}

              {actionSuccess && (
                <div className="bg-green-50 text-green-700 px-3 py-2 rounded flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  {actionSuccess}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !!actionSuccess}
            >
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={actionLoading || !!actionSuccess}
            >
              {actionLoading ? "Processing..." : "Approve & Transfer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
