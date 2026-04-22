"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Package,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  AlertTriangle,
  Send,
  Loader2,
  RefreshCw,
  ArrowRightLeft,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface StoreItem {
  id: string
  item_code: string
  item_name: string
  category: string
  quantity: number
  unit_price: number
  location: string
}

interface Requisition {
  id: string
  requisition_number: string
  item_id: string
  item_name: string
  item_code: string
  item_category: string
  central_stock_available: number
  regional_stock_current: number
  requested_quantity: number
  approved_quantity: number | null
  requested_by: string
  requesting_location: string
  status: "pending" | "approved" | "rejected" | "cancelled" | "fulfilled"
  approved_by: string | null
  approver_role: string | null
  approved_at: string | null
  rejection_reason: string | null
  fulfilled_by: string | null
  fulfilled_at: string | null
  justification: string | null
  notes: string | null
  created_at: string
}

export function RegionalStoreRequisitions() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("my-requisitions")
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [centralStoreItems, setCentralStoreItems] = useState<StoreItem[]>([])
  const [regionalStockLevels, setRegionalStockLevels] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [showNewRequisitionDialog, setShowNewRequisitionDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [submitting, setSubmitting] = useState(false)

  // Form state for new requisition
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null)
  const [requestedQuantity, setRequestedQuantity] = useState("")
  const [justification, setJustification] = useState("")

  // Approval form state
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null)
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | "fulfill">("approve")
  const [approvedQuantity, setApprovedQuantity] = useState("")
  const [rejectionReason, setRejectionReason] = useState("")
  const [processingApproval, setProcessingApproval] = useState(false)

  // Check if user is approver (admin, it_head, or it_store_head)
  const canApprove = user?.role === "admin" || user?.role === "it_head" || user?.role === "it_store_head"

  useEffect(() => {
    loadRequisitions()
    loadCentralStoreItems()
    loadRegionalStock()
  }, [user])

  const loadRequisitions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        location: user?.location || "",
        userRole: user?.role || "",
        status: statusFilter !== "all" ? statusFilter : "",
      })

      const response = await fetch(`/api/store/regional-requisitions?${params}`)
      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Error loading requisitions:", result.error)
        return
      }

      setRequisitions(result.requisitions || [])
    } catch (error) {
      console.error("[v0] Error loading requisitions:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadCentralStoreItems = async () => {
    try {
      setLoadingItems(true)
      // Fetch items from Central Stores only
      const response = await fetch("/api/store/items?location=Central Stores")
      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Error loading central store items:", result.error)
        return
      }

      // Filter items with stock > 0
      const itemsWithStock = (result.items || []).filter((item: StoreItem) => item.quantity > 0)
      setCentralStoreItems(itemsWithStock)
    } catch (error) {
      console.error("[v0] Error loading central store items:", error)
    } finally {
      setLoadingItems(false)
    }
  }

  const loadRegionalStock = async () => {
    try {
      // Fetch stock levels for user's location
      const response = await fetch(`/api/store/items?location=${encodeURIComponent(user?.location || "")}`)
      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Error loading regional stock:", result.error)
        return
      }

      // Create a map of item_code -> quantity
      const stockMap: Record<string, number> = {}
      ;(result.items || []).forEach((item: StoreItem) => {
        stockMap[item.item_code] = item.quantity
      })
      setRegionalStockLevels(stockMap)
    } catch (error) {
      console.error("[v0] Error loading regional stock:", error)
    }
  }

  const handleSubmitRequisition = async () => {
    if (!selectedItem || !requestedQuantity) {
      toast({
        title: "Validation Error",
        description: "Please select an item and enter quantity",
        variant: "destructive",
      })
      return
    }

    const qty = parseInt(requestedQuantity)
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid quantity greater than 0",
        variant: "destructive",
      })
      return
    }

    // Check if regional stock is at 0 or below
    const regionalStock = regionalStockLevels[selectedItem.item_code] || 0
    if (regionalStock > 0) {
      toast({
        title: "Cannot Request",
        description: `Your location still has ${regionalStock} units of this item. Requisitions are only allowed when stock is at 0 or below.`,
        variant: "destructive",
      })
      return
    }

    // Check if central store has enough
    if (selectedItem.quantity < qty) {
      toast({
        title: "Insufficient Stock",
        description: `Central Stores only has ${selectedItem.quantity} units available.`,
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch("/api/store/regional-requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItem.id,
          itemName: selectedItem.item_name,
          itemCode: selectedItem.item_code,
          itemCategory: selectedItem.category,
          centralStockAvailable: selectedItem.quantity,
          regionalStockCurrent: regionalStock,
          requestedQuantity: qty,
          requestedBy: user?.full_name || user?.name || user?.username,
          requesterUserId: user?.id,
          requestingLocation: user?.location,
          justification,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit requisition")
      }

      toast({
        title: "Requisition Submitted",
        description: `Your requisition ${result.requisition?.requisition_number} has been submitted for approval.`,
      })

      setShowNewRequisitionDialog(false)
      setSelectedItem(null)
      setRequestedQuantity("")
      setJustification("")
      loadRequisitions()
    } catch (error) {
      console.error("[v0] Error submitting requisition:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit requisition",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleApprovalAction = async () => {
    if (!selectedRequisition) return

    try {
      setProcessingApproval(true)

      const body: Record<string, any> = {
        requisitionId: selectedRequisition.id,
        action: approvalAction,
        approvedBy: user?.full_name || user?.name || user?.username,
        approverRole: user?.role,
      }

      if (approvalAction === "approve") {
        body.approvedQuantity = approvedQuantity ? parseInt(approvedQuantity) : selectedRequisition.requested_quantity
      } else if (approvalAction === "reject") {
        body.rejectionReason = rejectionReason
      } else if (approvalAction === "fulfill") {
        body.fulfilledBy = user?.full_name || user?.name || user?.username
      }

      const response = await fetch("/api/store/regional-requisitions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${approvalAction} requisition`)
      }

      toast({
        title: "Success",
        description: result.message || `Requisition ${approvalAction}ed successfully`,
      })

      setApprovalDialogOpen(false)
      setSelectedRequisition(null)
      setApprovedQuantity("")
      setRejectionReason("")
      loadRequisitions()
    } catch (error) {
      console.error("[v0] Error processing approval:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${approvalAction} requisition`,
        variant: "destructive",
      })
    } finally {
      setProcessingApproval(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100", icon: Clock },
      approved: { color: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: XCircle },
      cancelled: { color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200", icon: XCircle },
      fulfilled: { color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", icon: CheckCircle },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredRequisitions = requisitions.filter((req) => {
    const matchesSearch =
      req.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requisition_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Filter eligible items (only items where regional stock is 0 or below)
  const eligibleItems = centralStoreItems.filter((item) => {
    const regionalStock = regionalStockLevels[item.item_code] || 0
    return regionalStock <= 0 && item.quantity > 0
  })

  const myRequisitions = filteredRequisitions.filter(
    (req) => req.requested_by === (user?.full_name || user?.name || user?.username)
  )
  const pendingApprovals = filteredRequisitions.filter((req) => req.status === "pending")
  const approvedRequisitions = filteredRequisitions.filter((req) => req.status === "approved")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-stone-50 p-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Store Requisitions</h1>
          <p className="text-muted-foreground">
            Request items from Central Stores when your location's stock is depleted
          </p>
        </div>
        {user?.role === "regional_it_head" && (
          <Dialog open={showNewRequisitionDialog} onOpenChange={setShowNewRequisitionDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-100 hover:bg-green-200 text-green-900 border border-green-300">
                <Plus className="mr-2 h-4 w-4 text-green-900" />
                New Requisition
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Stock Requisition</DialogTitle>
                <DialogDescription>
                  Request items from Central Stores. Only items where your location has 0 stock are eligible.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {loadingItems ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading available items...</span>
                  </div>
                ) : eligibleItems.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No items available for requisition. Either Central Stores is out of stock, or your location still has stock of all items.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div>
                      <Label>Select Item from Central Stores *</Label>
                      <Select
                        value={selectedItem?.id || ""}
                        onValueChange={(value) => {
                          const item = eligibleItems.find((i) => i.id === value)
                          setSelectedItem(item || null)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an item to request" />
                        </SelectTrigger>
                        <SelectContent>
                          {eligibleItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{item.item_name}</span>
                                <Badge variant="outline" className="ml-2">
                                  {item.quantity} available
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedItem && (
                      <Card className="bg-emerald-50 border-emerald-200">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Item Code</p>
                              <p className="font-medium">{selectedItem.item_code}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Category</p>
                              <p className="font-medium">{selectedItem.category}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Central Stock</p>
                              <p className="font-medium text-green-600">{selectedItem.quantity} units</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Your Location Stock</p>
                              <p className="font-medium text-red-600">
                                {regionalStockLevels[selectedItem.item_code] || 0} units
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div>
                      <Label>Quantity Requested *</Label>
                      <Input
                        type="number"
                        min="1"
                        max={selectedItem?.quantity || 100}
                        value={requestedQuantity}
                        onChange={(e) => setRequestedQuantity(e.target.value)}
                        placeholder="Enter quantity needed"
                      />
                      {selectedItem && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum: {selectedItem.quantity} units
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Justification</Label>
                      <Textarea
                        value={justification}
                        onChange={(e) => setJustification(e.target.value)}
                        placeholder="Explain why you need this item..."
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline" onClick={() => setShowNewRequisitionDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSubmitRequisition}
                        disabled={!selectedItem || !requestedQuantity || submitting}
                        className="bg-green-100 hover:bg-green-200 text-green-900 border border-green-300"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Requisition
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Requisitions</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myRequisitions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-emerald-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-800">{pendingApprovals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved (Pending Fulfillment)</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-800" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-800">{approvedRequisitions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eligible Items</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{eligibleItems.length}</div>
            <p className="text-xs text-muted-foreground">Items you can request</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by item name, code, or requisition number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={loadRequisitions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-requisitions">My Requisitions</TabsTrigger>
          {canApprove && <TabsTrigger value="pending-approvals">Pending Approvals ({pendingApprovals.length})</TabsTrigger>}
          {canApprove && <TabsTrigger value="approved">Ready to Fulfill ({approvedRequisitions.length})</TabsTrigger>}
          <TabsTrigger value="all">All Requisitions</TabsTrigger>
        </TabsList>

        <TabsContent value="my-requisitions" className="mt-4">
          <RequisitionsList
            requisitions={myRequisitions}
            loading={loading}
            canApprove={false}
            onApprove={() => {}}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        {canApprove && (
          <TabsContent value="pending-approvals" className="mt-4">
            <RequisitionsList
              requisitions={pendingApprovals}
              loading={loading}
              canApprove={canApprove}
              onApprove={(req, action) => {
                setSelectedRequisition(req)
                setApprovalAction(action)
                setApprovedQuantity(String(req.requested_quantity))
                setApprovalDialogOpen(true)
              }}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
        )}

        {canApprove && (
          <TabsContent value="approved" className="mt-4">
            <RequisitionsList
              requisitions={approvedRequisitions}
              loading={loading}
              canApprove={canApprove}
              canFulfill={true}
              onApprove={(req, action) => {
                setSelectedRequisition(req)
                setApprovalAction(action)
                setApprovalDialogOpen(true)
              }}
              getStatusBadge={getStatusBadge}
            />
          </TabsContent>
        )}

        <TabsContent value="all" className="mt-4">
          <RequisitionsList
            requisitions={filteredRequisitions}
            loading={loading}
            canApprove={canApprove}
            onApprove={(req, action) => {
              setSelectedRequisition(req)
              setApprovalAction(action)
              setApprovedQuantity(String(req.requested_quantity))
              setApprovalDialogOpen(true)
            }}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Approval/Rejection Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve" && "Approve Requisition"}
              {approvalAction === "reject" && "Reject Requisition"}
              {approvalAction === "fulfill" && "Fulfill Requisition"}
            </DialogTitle>
            <DialogDescription>
              {selectedRequisition?.requisition_number} - {selectedRequisition?.item_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {selectedRequisition && (
              <Card className="bg-gray-50 dark:bg-gray-900">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Requested By</p>
                      <p className="font-medium">{selectedRequisition.requested_by}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium">{selectedRequisition.requesting_location}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Quantity Requested</p>
                      <p className="font-medium">{selectedRequisition.requested_quantity} units</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Central Stock</p>
                      <p className="font-medium">{selectedRequisition.central_stock_available} units</p>
                    </div>
                  </div>
                  {selectedRequisition.justification && (
                    <div className="mt-4">
                      <p className="text-muted-foreground">Justification</p>
                      <p className="font-medium">{selectedRequisition.justification}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {approvalAction === "approve" && (
              <div>
                <Label>Approved Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedRequisition?.requested_quantity}
                  value={approvedQuantity}
                  onChange={(e) => setApprovedQuantity(e.target.value)}
                />
              </div>
            )}

            {approvalAction === "reject" && (
              <div>
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this requisition is being rejected..."
                  rows={3}
                />
              </div>
            )}

            {approvalAction === "fulfill" && (
              <Alert className="bg-green-50 border-green-200">
                <ArrowRightLeft className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  This will transfer {selectedRequisition?.approved_quantity || selectedRequisition?.requested_quantity} units from Central Stores to {selectedRequisition?.requesting_location}.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApprovalAction}
                disabled={processingApproval || (approvalAction === "reject" && !rejectionReason)}
                className={
                  approvalAction === "approve"
                    ? "bg-green-100 hover:bg-green-200 text-green-900 border border-green-300"
                    : approvalAction === "reject"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-100 hover:bg-green-200 text-green-900 border border-green-300"
                }
              >
                {processingApproval ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {approvalAction === "approve" && <CheckCircle className="mr-2 h-4 w-4" />}
                    {approvalAction === "reject" && <XCircle className="mr-2 h-4 w-4" />}
                    {approvalAction === "fulfill" && <ArrowRightLeft className="mr-2 h-4 w-4" />}
                    {approvalAction.charAt(0).toUpperCase() + approvalAction.slice(1)}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper component for displaying requisitions list
function RequisitionsList({
  requisitions,
  loading,
  canApprove,
  canFulfill = false,
  onApprove,
  getStatusBadge,
}: {
  requisitions: Requisition[]
  loading: boolean
  canApprove: boolean
  canFulfill?: boolean
  onApprove: (req: Requisition, action: "approve" | "reject" | "fulfill") => void
  getStatusBadge: (status: string) => React.ReactNode
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (requisitions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No requisitions found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {requisitions.map((req) => (
        <Card key={req.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-lg">{req.item_name}</span>
                  {getStatusBadge(req.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {req.requisition_number} • {req.item_code}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span>Requested: {req.requested_quantity} units</span>
                  {req.approved_quantity && <span>Approved: {req.approved_quantity} units</span>}
                  <span>From: {req.requesting_location}</span>
                  <span>By: {req.requested_by}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(req.created_at).toLocaleString()}
                </p>
                {req.approved_by && (
                  <p className="text-xs text-muted-foreground">
                    {req.status === "rejected" ? "Rejected" : "Approved"} by: {req.approved_by} ({req.approver_role})
                  </p>
                )}
                {req.rejection_reason && (
                  <p className="text-sm text-red-600 mt-1">Reason: {req.rejection_reason}</p>
                )}
                {req.fulfilled_by && (
                  <p className="text-xs text-green-600">
                    Fulfilled by: {req.fulfilled_by} on {new Date(req.fulfilled_at!).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {canApprove && req.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-900 border-green-300 hover:bg-green-100"
                      onClick={() => onApprove(req, "approve")}
                    >
                      <CheckCircle className="h-4 w-4 mr-1 text-green-900" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => onApprove(req, "reject")}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                {canApprove && req.status === "approved" && (
                  <Button
                    size="sm"
                    className="bg-green-100 hover:bg-green-200 text-green-900 border border-green-300"
                    onClick={() => onApprove(req, "fulfill")}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-1 text-green-900" />
                    Fulfill
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
