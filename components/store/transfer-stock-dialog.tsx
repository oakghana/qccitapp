"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LOCATIONS } from "@/lib/locations"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface TransferStockDialogProps {
  open: boolean
  onClose: () => void
  item: {
    id: string
    item_name: string
    quantity_in_stock: number
    location: string
  }
  onSuccess: () => void
}

export default function TransferStockDialog({ open, onClose, item, onSuccess }: TransferStockDialogProps) {
  const { user } = useAuth()
  const [quantity, setQuantity] = useState("")
  const [toLocation, setToLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  const isHeadOffice = item.location === "Head Office"
  const canTransfer =
    user?.role === "admin" || user?.role === "store_head" || (user?.role === "regional_it_head" && !isHeadOffice)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const qty = Number.parseInt(quantity)
    if (qty <= 0 || qty > item.quantity_in_stock) {
      toast.error("Invalid quantity")
      return
    }

    if (!toLocation) {
      toast.error("Please select a destination location")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/store/transfer-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          itemName: item.item_name,
          quantity: qty,
          fromLocation: item.location,
          toLocation,
          transferredById: user?.id,
          transferredByName: user?.full_name || user?.username,
          notes,
        }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error)

      toast.success("Item transferred successfully")
      onSuccess()
      onClose()
      setQuantity("")
      setToLocation("")
      setNotes("")
    } catch (error: any) {
      toast.error(error.message || "Failed to transfer item")
    } finally {
      setLoading(false)
    }
  }

  if (!canTransfer) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Not Allowed</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            {isHeadOffice
              ? "Head Office stock is read-only. Only Admin or Store Head can transfer items."
              : "You do not have permission to transfer items."}
          </p>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Stock - {item.item_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>From Location</Label>
            <Input value={item.location} disabled />
          </div>

          <div>
            <Label>To Location *</Label>
            <Select value={toLocation} onValueChange={setToLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.filter((loc) => loc !== item.location).map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantity * (Available: {item.quantity_in_stock})</Label>
            <Input
              type="number"
              min="1"
              max={item.quantity_in_stock}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional transfer notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Transfer Stock
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
