"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

export function NewRequisitionForm({ onSubmit }: { onSubmit: () => void }) {
  const [formData, setFormData] = useState({
    requestedBy: "",
    department: "",
    purpose: "",
    items: [{ itemName: "", quantity: "", unit: "pcs" }],
  })

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: "", quantity: "", unit: "pcs" }],
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
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setFormData({ ...formData, items: updatedItems })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          <Label htmlFor="department">Department *</Label>
          <Select
            value={formData.department}
            onValueChange={(value) => setFormData({ ...formData, department: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IT Support">IT Support</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="HR">Human Resources</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="Admin">Administration</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose *</Label>
        <Textarea
          id="purpose"
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          placeholder="Describe the purpose of this requisition"
          rows={3}
          required
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

        {formData.items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-6 space-y-2">
              <Label>Item Name</Label>
              <Input
                value={item.itemName}
                onChange={(e) => updateItem(index, "itemName", e.target.value)}
                placeholder="e.g., HP Laptop Battery"
                required
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="col-span-3 space-y-2">
              <Label>Unit</Label>
              <Select value={item.unit} onValueChange={(value) => updateItem(index, "unit", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pieces</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1">
              {formData.items.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit">Submit Requisition</Button>
      </div>
    </form>
  )
}
