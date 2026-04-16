"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { locationsMatch } from "@/lib/location-filter"
import { toast } from "sonner"

interface TonerItem {
  id: string
  name: string
  sku: string
  quantity: number
  reorder_level: number
  unit: string
  location?: string
}

export function RegionalTonerUpdateForm({ onSuccess }: { onSuccess: () => void }) {
  const [tonerItems, setTonerItems] = useState<TonerItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState("")
  const [quantityToAdd, setQuantityToAdd] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    loadTonerItems()
  }, [])

  const loadTonerItems = async () => {
    if (!user?.location) return

    const { data, error } = await supabase
      .from("store_items")
      .select("id, name, sku, quantity, reorder_level, unit, location")
      .eq("category", "Consumables")
      .order("name")

    if (error) {
      console.error("[v0] Error loading toner items:", error)
      return
    }

    setTonerItems((data || []).filter((item) => locationsMatch(item.location, user.location)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedItemId || !quantityToAdd) {
      toast.error("Please select an item and enter quantity")
      return
    }

    setLoading(true)

    try {
      const selectedItem = tonerItems.find(item => item.id === selectedItemId)
      if (!selectedItem) {
        toast.error("Item not found")
        return
      }

      const newQuantity = selectedItem.quantity + Number.parseInt(quantityToAdd)

      // Update the store item quantity
      const { error: updateError } = await supabase
        .from("store_items")
        .update({ 
          quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedItemId)

      if (updateError) {
        console.error("[v0] Error updating stock:", updateError)
        toast.error("Failed to update stock level")
        return
      }

      // Record the transaction
      const { error: txnError } = await supabase
        .from("stock_transactions")
        .insert({
          item_id: selectedItemId,
          item_name: selectedItem.name,
          transaction_number: `TXN-UPDATE-${Date.now()}`,
          transaction_type: "receipt",
          quantity: Number.parseInt(quantityToAdd),
          location_name: user.location,
          reference_number: `REGIONAL-UPDATE-${Date.now()}`,
          performed_by_name: user.name || user.email || "Regional IT Head",
          notes: notes || `Stock updated by Regional IT Head at ${user.location}`,
          created_at: new Date().toISOString()
        })

      if (txnError) {
        console.error("[v0] Error recording transaction:", txnError)
        // Don't fail the whole operation if just the transaction fails
      }

      toast.success(`Successfully added ${quantityToAdd} ${selectedItem.unit} of ${selectedItem.name}`)
      setSelectedItemId("")
      setQuantityToAdd("")
      setNotes("")
      loadTonerItems()
      onSuccess()
    } catch (err) {
      console.error("[v0] Error updating toner stock:", err)
      toast.error("Failed to update stock level")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tonerItem">Toner/Consumable Item *</Label>
        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
          <SelectTrigger>
            <SelectValue placeholder="Select item to update" />
          </SelectTrigger>
          <SelectContent>
            {tonerItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} (Current: {item.quantity} {item.unit})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tonerItems.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No toner items found at your location. Request items from Central Stores first.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity to Add *</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          value={quantityToAdd}
          onChange={(e) => setQuantityToAdd(e.target.value)}
          placeholder="e.g., 5"
          required
        />
        <p className="text-sm text-muted-foreground">
          Enter the number of units received from Central Stores or purchased locally
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Received from Central Stores via REQ-12345"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading || !selectedItemId || !quantityToAdd}>
          {loading ? "Updating..." : "Update Stock Level"}
        </Button>
      </div>
    </form>
  )
}
