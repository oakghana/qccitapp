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

// Helper function to generate location name variations for database queries
function getLocationVariations(location: string): string[] {
  const variations = [location]
  
  // Map display names to database variations
  const locationMap: Record<string, string[]> = {
    "head_office": ["head_office", "Head Office"],
    "Head Office": ["head_office", "Head Office"],
    "central_stores": ["central_stores", "Central Stores"],
    "Central Stores": ["central_stores", "Central Stores"],
    "cr": ["cr", "CR", "Central Region"],
    "Central Region": ["cr", "CR", "Central Region"],
    "eastern": ["eastern", "Eastern", "Eastern Region", "er", "ER"],
    "Eastern Region": ["eastern", "Eastern", "Eastern Region", "er", "ER"],
    "kaase": ["kaase", "Kaase"],
    "Kaase": ["kaase", "Kaase"],
    "kumasi": ["kumasi", "Kumasi"],
    "Kumasi": ["kumasi", "Kumasi"],
    "takoradi_port": ["takoradi_port", "Takoradi Port"],
    "Takoradi Port": ["takoradi_port", "Takoradi Port"],
    "tema_port": ["tema_port", "Tema Port"],
    "Tema Port": ["tema_port", "Tema Port"],
    "tema_research": ["tema_research", "Tema Research"],
    "Tema Research": ["tema_research", "Tema Research"],
    "tema_training_school": ["tema_training_school", "Tema Training School"],
    "Tema Training School": ["tema_training_school", "Tema Training School"],
    "vr": ["vr", "VR", "Volta Region"],
    "Volta Region": ["vr", "VR", "Volta Region"],
    "wn": ["wn", "WN", "Western North"],
    "Western North": ["wn", "WN", "Western North"],
    "ws": ["ws", "WS", "Western South"],
    "Western South": ["ws", "WS", "Western South"],
    "bar": ["bar", "BAR"],
    "BAR": ["bar", "BAR"],
  }
  
  return locationMap[location] || [location]
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
    itReqNumber: "", // IT Requisition Number field
    notes: "",
    items: [{ item_id: "", itemName: "", quantity: "", unit: "pcs", availableQty: 0 }],
  })

  useEffect(() => {
    loadAvailableItems()
    // Debug: Check what locations exist in the database
    supabase.from("store_items").select("location").then(({ data }) => {
      const uniqueLocations = [...new Set(data?.map(item => item.location) || [])]
      console.log("[v0] All locations in store_items:", uniqueLocations)
    })
  }, [formData.location])

  const loadAvailableItems = async () => {
    try {
      setLoadingItems(true)
      
      // If no location selected, don't load items
      if (!formData.location) {
        setAvailableItems([])
        setLoadingItems(false)
        return
      }

      console.log("[v0] Loading items for location:", formData.location)

      // Create location name variations to handle database inconsistencies
      const locationVariations = getLocationVariations(formData.location)
      console.log("[v0] Checking location variations:", locationVariations)

      const { data, error } = await supabase
        .from("store_items")
        .select("*")
        .in("location", locationVariations)
        .gt("quantity", 0)
        .order("name")

      if (error) {
        console.error("[v0] Error loading store items:", error)
        setLoadingItems(false)
        return
      }

      console.log(`[v0] Found ${data?.length || 0} items at ${formData.location}:`, data)
      
      // Remove duplicates by keeping only the first instance of each item
      const uniqueItems = Array.from(
        new Map((data || []).map((item) => [item.name, item])).values()
      )
      setAvailableItems(uniqueItems)
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
            requested_by_role: user.role,
            beneficiary: formData.beneficiary,
            location: formData.location,
            it_req_number: formData.itReqNumber, // Add IT Req Number to database
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
          <Select 
            value={formData.location} 
            onValueChange={(value) => {
              // Reset items when location changes
              setFormData({ 
                ...formData, 
                location: value,
                items: [{ item_id: "", itemName: "", quantity: "", unit: "pcs", availableQty: 0 }]
              })
            }}
          >
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

        <div className="space-y-2">
          <Label htmlFor="itReqNumber">IT Req. No.</Label>
          <Input
            id="itReqNumber"
            value={formData.itReqNumber}
            onChange={(e) => setFormData({ ...formData, itReqNumber: e.target.value })}
            placeholder="e.g., IT-2026-001 (optional)"
          />
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

        {!formData.location ? (
          <p className="text-sm text-muted-foreground">Please select a location first to see available items</p>
        ) : loadingItems ? (
          <p className="text-sm text-muted-foreground">Loading available items from {formData.location}...</p>
        ) : availableItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items available at {formData.location}</p>
        ) : (
          formData.items.map((item, index) => (
            <div key={index} className="space-y-2 p-4 border rounded-lg">
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6 space-y-2">
                  <Label>Select Item from Stock at {formData.location} *</Label>
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
