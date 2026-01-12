"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Download,
  Package,
  TrendingDown,
  TrendingUp,
  History,
  FileText,
  Edit,
  Trash2,
  UserPlus,
  Save,
  X,
} from "lucide-react"
import { downloadCSV, printToPDF } from "@/lib/export-utils"
import { useAuth } from "@/lib/auth-context"
import { canManageStock, canAssignItems } from "@/lib/location-filter"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface StockTransfer {
  id: string
  item_name: string
  quantity: number
  from_location: string
  to_location: string
  transferred_by_name: string
  received_by_name: string
  status: string
  notes: string
  transfer_date: string
  received_date: string
}

interface StockCardDetailModalProps {
  open: boolean
  onClose: () => void
  item: {
    id: string
    item_name: string
    category: string
    quantity: number
    reorder_level: number
    location: string
  }
}

export default function StockCardDetailModal({ open, onClose, item }: StockCardDetailModalProps) {
  const { user } = useAuth()
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    quantity: item.quantity,
    reorder_level: item.reorder_level,
  })
  const [deleteReason, setDeleteReason] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assignData, setAssignData] = useState({
    assignedTo: "",
    quantity: 1,
    notes: "",
  })
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState("")

  useEffect(() => {
    if (open && item) {
      fetchTransferHistory()
    }
  }, [open, item])

  const fetchTransferHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/store/item-history?itemName=${encodeURIComponent(item.item_name)}`)
      const data = await response.json()
      setTransfers(data.transfers || [])
    } catch (error) {
      console.error("Failed to fetch transfer history:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const data = {
      title: `Stock Card - ${item.item_name}`,
      fileName: `stock-card-${item.item_name.replace(/\s+/g, "-").toLowerCase()}`,
      headers: ["Date", "From Location", "To Location", "Quantity", "Transferred By", "Status", "Notes"],
      rows: transfers.map((t) => [
        new Date(t.transfer_date).toLocaleDateString(),
        t.from_location,
        t.to_location,
        t.quantity,
        t.transferred_by_name || "System",
        t.status,
        t.notes || "-",
      ]),
    }
    downloadCSV(data)
  }

  const exportToPDF = () => {
    printToPDF("stock-card-content", `stock-card-${item.item_name}`)
  }

  const handleEdit = async () => {
    if (!user) return
    setActionLoading(true)
    setActionError("")

    try {
      const response = await fetch("/api/store/update-item", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          updates: editData,
          updatedBy: user.full_name || user.username,
          reason: "Stock level adjustment",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update item")
      }

      setIsEditing(false)
      window.location.reload() // Refresh to show updated data
    } catch (error: any) {
      setActionError(error.message || "Failed to update item")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !deleteReason.trim()) {
      setActionError("Please provide a reason for deletion")
      return
    }

    setActionLoading(true)
    setActionError("")

    try {
      const response = await fetch("/api/store/delete-item", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          deletedBy: user.full_name || user.username,
          reason: deleteReason,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete item")
      }

      onClose()
      window.location.reload() // Refresh to show updated list
    } catch (error: any) {
      setActionError(error.message || "Failed to delete item")
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!user || !assignData.assignedTo || assignData.quantity <= 0) {
      setActionError("Please fill in all required fields")
      return
    }

    if (assignData.quantity > item.quantity) {
      setActionError(`Cannot assign ${assignData.quantity} items. Only ${item.quantity} available in stock.`)
      return
    }

    setActionLoading(true)
    setActionError("")

    try {
      const response = await fetch("/api/store/assign-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          itemName: item.item_name,
          quantity: assignData.quantity,
          assignedTo: assignData.assignedTo,
          assignedBy: user.full_name || user.username,
          location: item.location,
          notes: assignData.notes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to assign item")
      }

      setShowAssignForm(false)
      setAssignData({ assignedTo: "", quantity: 1, notes: "" })
      window.location.reload() // Refresh to show updated data
    } catch (error: any) {
      setActionError(error.message || "Failed to assign item")
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!user) return

    setActionLoading(true)
    setActionError("")

    try {
      const response = await fetch("/api/store/update-item", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          updates: {
            quantity: editData.quantity,
            reorder_level: editData.reorder_level,
          },
          updatedBy: user.email || user.username,
          userRole: user.role,
          userLocation: user.location,
          reason: "Stock details updated via UI",
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update item")
      }

      setIsEditing(false)
      setActionError("")
      // Refresh the parent component data
      onClose()
      window.location.reload()
    } catch (error: any) {
      console.error("[v0] Error updating stock:", error)
      setActionError(error.message || "Failed to update stock")
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Stock Card - {item.item_name}
          </DialogTitle>
        </DialogHeader>

        <div id="stock-card-content" className="space-y-6">
          {actionError && (
            <Alert variant="destructive">
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}

          {/* Item Summary */}
          <Card>
            <CardContent className="pt-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-quantity">Current Stock</Label>
                      <Input
                        id="edit-quantity"
                        type="number"
                        value={editData.quantity}
                        onChange={(e) => setEditData({ ...editData, quantity: Number.parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-reorder">Reorder Level</Label>
                      <Input
                        id="edit-reorder"
                        type="number"
                        value={editData.reorder_level}
                        onChange={(e) => setEditData({ ...editData, reorder_level: Number.parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} disabled={actionLoading} size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      {actionLoading ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Stock</p>
                      <p className="text-2xl font-bold">{item.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reorder Level</p>
                      <p className="text-2xl font-bold">{item.reorder_level}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{item.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{item.location}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={exportToPDF} variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>

            {user && canManageStock(user) && !isEditing && (
              <>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Stock
                </Button>
                <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Item
                </Button>
              </>
            )}

            {user && canAssignItems(user) && !showAssignForm && (
              <Button onClick={() => setShowAssignForm(true)} variant="default" size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign to User
              </Button>
            )}
          </div>

          {/* Assignment Form */}
          {showAssignForm && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold">Assign Item to User</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Assigned To (Username/Email)</Label>
                    <Input
                      value={assignData.assignedTo}
                      onChange={(e) => setAssignData({ ...assignData, assignedTo: e.target.value })}
                      placeholder="Enter username or email"
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      max={item.quantity}
                      value={assignData.quantity}
                      onChange={(e) => setAssignData({ ...assignData, quantity: Number.parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    value={assignData.notes}
                    onChange={(e) => setAssignData({ ...assignData, notes: e.target.value })}
                    placeholder="Add any notes about this assignment..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAssign} disabled={actionLoading}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Item
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAssignForm(false)
                      setAssignData({ assignedTo: "", quantity: 1, notes: "" })
                    }}
                    variant="outline"
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <Card className="border-destructive">
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-destructive">Confirm Deletion</h3>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. Please provide a reason for deleting this item.
                </p>
                <div>
                  <Label>Reason for Deletion *</Label>
                  <Textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Explain why this item is being deleted..."
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDelete} variant="destructive" disabled={actionLoading || !deleteReason.trim()}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Confirm Delete
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteReason("")
                    }}
                    variant="outline"
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transfer History */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className="h-5 w-5" />
              Transfer History
            </h3>

            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading history...</p>
            ) : transfers.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No transfer history available</p>
            ) : (
              <div className="space-y-3">
                {transfers.map((transfer) => (
                  <Card key={transfer.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {transfer.from_location === item.location ? (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            ) : (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            )}
                            <span className="font-medium">
                              {transfer.from_location} → {transfer.to_location}
                            </span>
                            <Badge variant={transfer.status === "completed" ? "default" : "secondary"}>
                              {transfer.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Quantity</p>
                              <p className="font-semibold">{transfer.quantity} units</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Date</p>
                              <p>{new Date(transfer.transfer_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Transferred By</p>
                              <p>{transfer.transferred_by_name || "System"}</p>
                            </div>
                            {transfer.notes && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground">Notes</p>
                                <p className="text-sm">{transfer.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { StockCardDetailModal }
