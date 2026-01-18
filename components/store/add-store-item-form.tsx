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

export function AddStoreItemForm({ onSubmit }: { onSubmit: () => void }) {
  const [formData, setFormData] = useState({
    itemName: "",
    category: "",
    sku: "",
    quantity: "",
    reorderLevel: "",
    unit: "",
    location: "",
    sivNumber: "",
    supplier: "",
  })
  const [customCategory, setCustomCategory] = useState("")
  const [showCustomCategory, setShowCustomCategory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error: insertError } = await supabase
        .from("store_items")
        .insert({
          name: formData.itemName,
          category: formData.category,
          sku: formData.sku || `SKU-${Date.now()}`,
          siv_number: formData.sivNumber,
          quantity: Number.parseInt(formData.quantity) || 0,
          reorder_level: Number.parseInt(formData.reorderLevel) || 0,
          unit: formData.unit,
          location: formData.location || user?.location || "Head Office",
          supplier: formData.supplier || "N/A",
          last_restocked: new Date().toISOString().split("T")[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      if (insertError) {
        console.error("[v0] Error adding store item:", insertError)
        setError(insertError.message)
        return
      }

      console.log("[v0] Successfully added store item:", data)
      onSubmit()
    } catch (err) {
      console.error("[v0] Error adding store item:", err)
      setError(err instanceof Error ? err.message : "Failed to add item")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="sivNumber">SIV Number *</Label>
        <Input
          id="sivNumber"
          value={formData.sivNumber}
          onChange={(e) => setFormData({ ...formData, sivNumber: e.target.value })}
          placeholder="e.g., SIV-2025-001"
          required
        />
        <p className="text-sm text-muted-foreground">Store Issue Voucher number to track items received</p>
      </div>

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
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="Auto-generated if empty"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          {!showCustomCategory ? (
            <Select
              value={formData.category}
              onValueChange={(value) => {
                if (value === "__create_category__") {
                  setShowCustomCategory(true)
                  setFormData({ ...formData, category: "" })
                } else {
                  setFormData({ ...formData, category: value })
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hardware">Hardware</SelectItem>
                <SelectItem value="Network Switches">Network Switches</SelectItem>
                <SelectItem value="Routers">Routers</SelectItem>
                <SelectItem value="Access Points">Access Points</SelectItem>
                <SelectItem value="Network Cables">Network Cables</SelectItem>
                <SelectItem value="Cat6">Cat6 Cables</SelectItem>
                <SelectItem value="Cat5e">Cat5e Cables</SelectItem>
                <SelectItem value="Patch Panels">Patch Panels</SelectItem>
                <SelectItem value="Power Supplies">Power Supplies</SelectItem>
                <SelectItem value="Batteries">Batteries</SelectItem>
                <SelectItem value="Storage">Storage (SSD/HDD)</SelectItem>
                <SelectItem value="Memory">Memory (RAM)</SelectItem>
                <SelectItem value="Motherboards">Motherboards</SelectItem>
                <SelectItem value="Graphics Cards">Graphics Cards</SelectItem>
                <SelectItem value="Monitors">Monitors</SelectItem>
                <SelectItem value="Keyboards">Keyboards</SelectItem>
                <SelectItem value="Mice">Mice</SelectItem>
                <SelectItem value="Webcams">Webcams</SelectItem>
                <SelectItem value="Headsets">Headsets</SelectItem>
                <SelectItem value="Printers">Printers</SelectItem>
                <SelectItem value="Printer Toner">Printer Toner</SelectItem>
                <SelectItem value="Cables">Cables</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
                <SelectItem value="Consumables">Consumables</SelectItem>
                <SelectItem value="Peripherals">Peripherals</SelectItem>
                <SelectItem value="Laptop Parts">Laptop Parts</SelectItem>
                <SelectItem value="Software Licenses">Software Licenses</SelectItem>
                <SelectItem value="Tools">Tools</SelectItem>
                <SelectItem value="Adapters">Adapters & Converters</SelectItem>
                <SelectItem value="UPS">UPS / Power Backup</SelectItem>
                <SelectItem value="Racks">Racks & Enclosures</SelectItem>
                <SelectItem value="Labels">Labels & Tags</SelectItem>
                <SelectItem value="__create_category__">+ Add custom category</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Enter custom category (e.g., SWITCH)"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => {
                    if (customCategory.trim()) {
                      setFormData({ ...formData, category: customCategory.trim() })
                      setShowCustomCategory(false)
                    }
                  }}
                >
                  Save Category
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setCustomCategory("")
                    setShowCustomCategory(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <Input
            id="supplier"
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
            placeholder="e.g., Tech Supplies Ltd"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Initial Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reorderLevel">Reorder Level *</Label>
          <Input
            id="reorderLevel"
            type="number"
            value={formData.reorderLevel}
            onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
            placeholder="0"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Unit *</Label>
          <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pieces">Pieces</SelectItem>
              <SelectItem value="box">Box</SelectItem>
              <SelectItem value="pack">Pack</SelectItem>
              <SelectItem value="set">Set</SelectItem>
              <SelectItem value="unit">Unit</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Item"}
        </Button>
      </div>
    </form>
  )
}
