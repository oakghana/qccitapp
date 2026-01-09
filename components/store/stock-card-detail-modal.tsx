"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Package, TrendingDown, TrendingUp, History, FileText } from "lucide-react"
import { downloadCSV, printToPDF } from "@/lib/export-utils"

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
    quantity_in_stock: number
    reorder_level: number
    unit_price: number
    location: string
  }
}

export default function StockCardDetailModal({ open, onClose, item }: StockCardDetailModalProps) {
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [loading, setLoading] = useState(false)

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
          {/* Item Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-semibold">{item.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Stock</p>
                  <p className="font-semibold text-2xl">{item.quantity_in_stock}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reorder Level</p>
                  <p className="font-semibold">{item.reorder_level}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{item.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={exportToPDF} variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>

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
