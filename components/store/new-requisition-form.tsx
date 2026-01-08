"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { getLocationOptions } from "@/lib/locations"

interface StoreItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  location: string
}

export function NewRequisitionForm({ onSubmit }: { onSubmit: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const supabase = createClient()
  const [availableItems, setAvailableItems] = useState<StoreItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)

  const [formData, setFormData] = useState({
    requestedBy: user?.full_name || "",
    beneficiary: "",
    location: user?.location || "",
    notes: "",
    items: [{ item_id: "", itemName: "", quantity: "", unit: "pcs", availableQty: 0 }],
  })

  useEffect(() => {
    loadAvailableItems()
  }, [])

  const loadAvailableItems = async () => {
    try {
      setLoadingItems(true)
      const { data, error } = await supabase.from("store_items").select("*").gt("quantity", 0).order("name")

      if (error) {
        console.error("[v0] Error loading store items:", error)
        return
      }

      console.log("[v0] Loaded available store items:", data)
      setAvailableItems(data || [])
    } catch (err) {
      console.error("[v0] Error loading items:", err)
    } finally {
      setLoadingItems(false)
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { item_id: "", itemName: "", quantity: "", unit: "pcs", availableQty: 0 }],
    })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    })
  }

  const updateItem = (index: number, field: string, value: string) => {
    const updatedItems = [...formData.items]

    if (field === "item_id") {
      // Find the selected item details
      const selectedItem = availableItems.find((item) => item.id === value)
      if (selectedItem) {
        updatedItems[index] = {
          ...updatedItems[index],
          item_id: value,
          itemName: selectedItem.name,
          unit: selectedItem.unit,
          availableQty: selectedItem.quantity,
        }
      }
    } else {
      updatedItems[index] = { ...updatedItems[index], [field]: value }
    }

    setFormData({ ...formData, items: updatedItems })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    for (const item of formData.items) {
      if (!item.item_id) {
        setError("Please select items from the available inventory")
        return
      }
      const requestedQty = Number.parseInt(item.quantity)
      if (requestedQty > item.availableQty) {
        setError(
          `Requested quantity for ${item.itemName} (${requestedQty}) exceeds available stock (${item.availableQty})`,
        )
        return
      }
    }

    setLoading(true)

    try {
      const date = new Date()
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "")
      const randomNum = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")
      const requisitionNumber = `REQ-${dateStr}-${randomNum}`

      console.log("[v0] Saving requisition to Supabase:", formData)

      const { data, error: insertError } = await supabase
        .from("store_requisitions")
        .insert([
          {
            requisition_number: requisitionNumber,
            requested_by: formData.requestedBy,
            beneficiary: formData.beneficiary,
            location: formData.location,
            items: formData.items.map((item) => ({
              item_id: item.item_id,
              itemName: item.itemName,
              quantity: Number.parseInt(item.quantity),
              unit: item.unit,
            })),
            status: "pending",
            notes: formData.notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()

      if (insertError) {
        console.error("[v0] Error saving requisition:", insertError)
        setError(insertError.message)
        return
      }

      console.log("[v0] Requisition saved successfully:", data)
      onSubmit()
    } catch (err) {
      console.error("[v0] Error:", err)
      setError("Failed to save requisition")
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="requestedBy">Requested By *</Label>
          <Input
            id="requestedBy"
            value={formData.requestedBy}
            onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
            placeholder="Your name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="beneficiary">Beneficiary/User *</Label>
          <Input
            id="beneficiary"
            value={formData.beneficiary}
            onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
            placeholder="Name of person who will use the items"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {getLocationOptions().map((location) => (
                <SelectItem key={location.value} value={location.value}>
                  {location.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes / Purpose</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add any notes or describe the purpose of this requisition"
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Items Requested *</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        {loadingItems ? (
          <p className="text-sm text-muted-foreground">Loading available items...</p>
        ) : (
          formData.items.map((item, index) => (
            <div key={index} className="space-y-2 p-4 border rounded-lg">
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6 space-y-2">
                  <Label>Select Item from Stock *</Label>
                  <Select value={item.item_id} onValueChange={(value) => updateItem(index, "item_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an item" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableItems.map((storeItem) => (
                        <SelectItem key={storeItem.id} value={storeItem.id}>
                          {storeItem.name} ({storeItem.quantity} {storeItem.unit} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                    placeholder="0"
                    max={item.availableQty}
                    required
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label>Unit</Label>
                  <Input value={item.unit} disabled className="bg-muted" />
                </div>
                <div className="col-span-1">
                  {formData.items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
              {item.availableQty > 0 && (
                <p className="text-xs text-muted-foreground">
                  Available in stock: {item.availableQty} {item.unit}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading || loadingItems}>
          {loading ? "Saving..." : "Submit Requisition"}
        </Button>
      </div>
    </form>
  )
}
