"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle } from "lucide-react"

interface Requisition {
  id: string
  requisition_number: string
  requested_by: string
  beneficiary?: string
  location: string
  items: { item_id?: string; itemName: string; quantity: number; unit: string }[]
  created_at: string
  status: string
}

export function IssueItemsForm({
  requisition,
  onSubmit,
  onCancel,
}: {
  requisition: Requisition
  onSubmit: () => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notes, setNotes] = useState("")
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("[v0] Issuing items for requisition:", requisition.id)

      for (const item of requisition.items) {
        if (item.item_id) {
          // Get current stock level
          const { data: currentItem, error: fetchError } = await supabase
            .from("store_items")
            .select("quantity")
            .eq("id", item.item_id)
            .single()

          if (fetchError) {
            console.error("[v0] Error fetching item:", fetchError)
            setError(`Failed to fetch stock level for ${item.itemName}`)
            setLoading(false)
            return
          }

          const newQuantity = currentItem.quantity - item.quantity

          if (newQuantity < 0) {
            setError(
              `Insufficient stock for ${item.itemName}. Available: ${currentItem.quantity}, Required: ${item.quantity}`,
            )
            setLoading(false)
            return
          }

          // Update stock level
          const { error: updateError } = await supabase
            .from("store_items")
            .update({
              quantity: newQuantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.item_id)

          if (updateError) {
            console.error("[v0] Error updating stock:", updateError)
            setError(`Failed to update stock for ${item.itemName}`)
            setLoading(false)
            return
          }

          console.log(`[v0] Reduced stock for ${item.itemName}: ${currentItem.quantity} -> ${newQuantity}`)
        }
      }

      console.log("[v0] All items issued successfully, stock levels updated")
      onSubmit()
    } catch (err) {
      console.error("[v0] Error issuing items:", err)
      setError("Failed to issue items")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Requester</Label>
            <p className="font-medium">{requisition.requested_by}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Beneficiary</Label>
            <p className="font-medium">{requisition.beneficiary || "N/A"}</p>
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground">Location</Label>
          <p className="font-medium">{requisition.location}</p>
        </div>

        <div>
          <Label className="text-muted-foreground mb-2 block">Items to Issue (Stock will be reduced)</Label>
          <div className="space-y-2">
            {requisition.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-background rounded">
                <span className="font-medium">{item.itemName}</span>
                <Badge variant="destructive">
                  -{item.quantity} {item.unit}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Issue Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any notes about this issuance..."
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Issuing Items..." : "Issue Items & Reduce Stock"}
        </Button>
      </div>
    </form>
  )
}
