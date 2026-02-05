"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { getLocationOptions } from "@/lib/locations"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { normalizeCategoryName } from "@/lib/category-utils"

export function AddStoreItemForm({ onSubmit }: { onSubmit: () => void }) {
  const [formData, setFormData] = useState({
    itemName: "",
    description: "",
    category: "",
    sku: "",
    quantity: "",
    unitPrice: "",
    location: "",
    supplier: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { user } = useAuth()
  const supabase = createClient()
  const { toast } = useToast()

  // Authorization check - only admin and it_store_head can add stock
  const canAddStock = user?.role === "admin" || user?.role === "it_store_head"

  if (!canAddStock) {
    return (
      <div className="p-4 text-center">
        <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          You do not have permission to add stock items. Only Admin and IT Store Head can add stock.
        </p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/store/add-stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.itemName,
          description: formData.description,
          category: normalizeCategoryName(formData.category),
          sku: formData.sku || `SKU-${Date.now()}`,
          quantity: parseInt(formData.quantity) || 0,
          unit_price: parseFloat(formData.unitPrice) || 0,
          location: formData.location || user?.location || "Head Office",
          supplier: formData.supplier,
          user_id: user?.id,
          user_role: user?.role,
          notes: formData.notes,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to add stock")
      }

      setSuccess(result.message || "Stock added successfully!")
      toast({
        title: "✅ Stock Added Successfully",
        description: `Added ${formData.quantity} units of "${formData.itemName}" to inventory`,
      })
      
      // Reset form
      setFormData({
        itemName: "",
        description: "",
        category: "",
        sku: "",
        quantity: "",
        unitPrice: "",
        location: "",
        supplier: "",
        notes: "",
      })
      
      // Call parent callback after short delay to show success message
      setTimeout(() => {
        onSubmit()
      }, 1500)
      
    } catch (err) {
      console.error("[v0] Error adding stock:", err)
      setError(err instanceof Error ? err.message : "Failed to add stock")
      toast({
        title: "❌ Failed to Add Stock",
        description: err instanceof Error ? err.message : "Failed to add stock item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}
      {success && <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">{success}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="itemName">Item Name *</Label>
          <Input
            id="itemName"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
            placeholder="e.g., HP Laptop Battery"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Computers">Computers</SelectItem>
              <SelectItem value="Printers">Printers</SelectItem>
              <SelectItem value="Network Equipment">Network Equipment</SelectItem>
              <SelectItem value="Peripherals">Peripherals</SelectItem>
              <SelectItem value="Accessories">Accessories</SelectItem>
              <SelectItem value="Software">Software</SelectItem>
              <SelectItem value="Consumables">Consumables</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the item"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="Auto-generated if empty"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="0"
            min="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit Price</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            value={formData.unitPrice}
            onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
            placeholder="0.00"
            min="0"
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
              {getLocationOptions().map((loc) => (
                <SelectItem key={loc.value} value={loc.label}>
                  {loc.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            placeholder="e.g., HP Ghana Ltd."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about the stock addition"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Adding Stock..." : "Add to Stock"}
      </Button>
    </form>
  )
}
