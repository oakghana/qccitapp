"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Plus, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface ExistingStockItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  sku: string
}

const CATEGORIES = [
  "Computers",
  "Printers",
  "Network Equipment",
  "Peripherals",
  "Accessories",
  "Software",
  "Consumables",
  "Toners",
  "Cables",
  "Storage Devices",
  "Monitors",
  "UPS/Power",
  "Other",
]

export function AddCentralStockForm({ onSubmit }: { onSubmit: () => void }) {
  const [mode, setMode] = useState<"existing" | "new">("existing")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [existingItems, setExistingItems] = useState<ExistingStockItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const { user } = useAuth()
  const supabase = createClient()
  const { toast } = useToast()

  // Form data for adding to existing item
  const [existingFormData, setExistingFormData] = useState({
    item_id: "",
    quantity: "",
    notes: "",
    supplier: "",
    reference_number: "",
  })

  // Form data for new item
  const [newFormData, setNewFormData] = useState({
    name: "",
    description: "",
    category: "",
    customCategory: "",
    sku: "",
    quantity: "",
    unit: "pcs",
    unitPrice: "",
    supplier: "",
    notes: "",
    reference_number: "",
  })

  // Authorization check
  const canAddStock = user?.role === "admin" || user?.role === "it_store_head"

  useEffect(() => {
    loadExistingItems()
  }, [])

  const loadExistingItems = async () => {
    try {
      setLoadingItems(true)
      
      // Load all items from Central Stores
      const { data, error } = await supabase
        .from("store_items")
        .select("id, name, category, quantity, unit, sku")
        .in("location", ["central_stores", "Central Stores"])
        .order("name")

      if (error) {
        console.error("[v0] Error loading central store items:", error)
        return
      }

      setExistingItems(data || [])
    } catch (err) {
      console.error("[v0] Error:", err)
    } finally {
      setLoadingItems(false)
    }
  }

  const handleAddToExisting = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!existingFormData.item_id) {
        setError("Please select an item")
        setLoading(false)
        return
      }

      const quantity = parseInt(existingFormData.quantity)
      if (!quantity || quantity <= 0) {
        setError("Please enter a valid quantity")
        setLoading(false)
        return
      }

      // Get the selected item
      const selectedItem = existingItems.find(item => item.id === existingFormData.item_id)
      if (!selectedItem) {
        setError("Selected item not found")
        setLoading(false)
        return
      }

      // Update the stock quantity
      const newQuantity = selectedItem.quantity + quantity

      const { error: updateError } = await supabase
        .from("store_items")
        .update({
          quantity: newQuantity,
          quantity_in_stock: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingFormData.item_id)

      if (updateError) {
        throw updateError
      }

      // Record the stock transaction
      await supabase.from("stock_transactions").insert({
        item_id: existingFormData.item_id,
        item_name: selectedItem.name,
        transaction_type: "stock_addition",
        quantity: quantity,
        unit: selectedItem.unit,
        location_name: "central_stores",
        reference_type: "stock_replenishment",
        reference_number: existingFormData.reference_number || `ADD-${Date.now()}`,
        notes: existingFormData.notes || `Stock added to Central Stores. Supplier: ${existingFormData.supplier || 'N/A'}`,
        performed_by: user?.full_name || user?.name || "System",
        created_at: new Date().toISOString(),
      })

      setSuccess(`Successfully added ${quantity} ${selectedItem.unit} of "${selectedItem.name}" to Central Stores. New stock level: ${newQuantity}`)
      toast({
        title: "📦 Stock Added Successfully",
        description: `Added ${quantity} ${selectedItem.unit} of "${selectedItem.name}" to Central Stores`,
      })
      
      // Reset form
      setExistingFormData({
        item_id: "",
        quantity: "",
        notes: "",
        supplier: "",
        reference_number: "",
      })
      
      // Refresh items list
      await loadExistingItems()
      
      // Call parent callback after delay
      setTimeout(() => {
        onSubmit()
      }, 2000)

    } catch (err) {
      console.error("[v0] Error adding stock:", err)
      setError(err instanceof Error ? err.message : "Failed to add stock")
      toast({
        title: "❌ Failed to Add Stock",
        description: err instanceof Error ? err.message : "Failed to add stock to existing item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!newFormData.name.trim()) {
        setError("Please enter an item name")
        setLoading(false)
        return
      }

      const category = newFormData.category === "custom" 
        ? newFormData.customCategory.trim() 
        : newFormData.category

      if (!category) {
        setError("Please select or enter a category")
        setLoading(false)
        return
      }

      const quantity = parseInt(newFormData.quantity)
      if (!quantity || quantity <= 0) {
        setError("Please enter a valid quantity")
        setLoading(false)
        return
      }

      // Generate SKU if not provided
      const sku = newFormData.sku.trim() || `CS-${Date.now()}`

      // Insert new item
      const { data: newItem, error: insertError } = await supabase
        .from("store_items")
        .insert({
          name: newFormData.name.trim(),
          description: newFormData.description.trim(),
          category: category,
          sku: sku,
          quantity: quantity,
          quantity_in_stock: quantity,
          unit: newFormData.unit,
          unit_price: parseFloat(newFormData.unitPrice) || 0,
          location: "central_stores",
          supplier: newFormData.supplier.trim(),
          notes: newFormData.notes.trim(),
          status: "in_stock",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Record the stock transaction
      await supabase.from("stock_transactions").insert({
        item_id: newItem.id,
        item_name: newFormData.name.trim(),
        transaction_type: "initial_stock",
        quantity: quantity,
        unit: newFormData.unit,
        location_name: "central_stores",
        reference_type: "new_item",
        reference_number: newFormData.reference_number || `NEW-${Date.now()}`,
        notes: newFormData.notes || `New item added to Central Stores. Supplier: ${newFormData.supplier || 'N/A'}`,
        performed_by: user?.full_name || user?.name || "System",
        created_at: new Date().toISOString(),
      })

      setSuccess(`Successfully added new item "${newFormData.name}" with ${quantity} ${newFormData.unit} to Central Stores`)
      toast({
        title: "✅ Item Created Successfully",
        description: `Added new item "${newFormData.name}" with ${quantity} ${newFormData.unit} to Central Stores`,
      })
      
      // Reset form
      setNewFormData({
        name: "",
        description: "",
        category: "",
        customCategory: "",
        sku: "",
        quantity: "",
        unit: "pcs",
        unitPrice: "",
        supplier: "",
        notes: "",
        reference_number: "",
      })
      
      // Refresh items list
      await loadExistingItems()
      
      // Call parent callback after delay
      setTimeout(() => {
        onSubmit()
      }, 2000)

    } catch (err) {
      console.error("[v0] Error adding new item:", err)
      setError(err instanceof Error ? err.message : "Failed to add new item")
      toast({
        title: "❌ Failed to Create Item",
        description: err instanceof Error ? err.message : "Failed to create new item",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!canAddStock) {
    return (
      <div className="p-4 text-center">
        <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          Only Admin and IT Store Head can add stock to Central Stores.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      <Tabs value={mode} onValueChange={(v) => setMode(v as "existing" | "new")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing">
            <Package className="h-4 w-4 mr-2" />
            Add to Existing Item
          </TabsTrigger>
          <TabsTrigger value="new">
            <Plus className="h-4 w-4 mr-2" />
            Add New Item
          </TabsTrigger>
        </TabsList>

        <TabsContent value="existing" className="space-y-4 mt-4">
          <form onSubmit={handleAddToExisting} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="existingItem">Select Existing Item *</Label>
              {loadingItems ? (
                <p className="text-sm text-muted-foreground">Loading items...</p>
              ) : (
                <Select 
                  value={existingFormData.item_id} 
                  onValueChange={(value) => setExistingFormData({ ...existingFormData, item_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an item to add stock to" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} - Current Stock: {item.quantity} {item.unit} ({item.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addQuantity">Quantity to Add *</Label>
                <Input
                  id="addQuantity"
                  type="number"
                  value={existingFormData.quantity}
                  onChange={(e) => setExistingFormData({ ...existingFormData, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={existingFormData.supplier}
                  onChange={(e) => setExistingFormData({ ...existingFormData, supplier: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={existingFormData.reference_number}
                onChange={(e) => setExistingFormData({ ...existingFormData, reference_number: e.target.value })}
                placeholder="e.g., Invoice number, PO number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={existingFormData.notes}
                onChange={(e) => setExistingFormData({ ...existingFormData, notes: e.target.value })}
                placeholder="Any additional notes about this stock addition"
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || loadingItems}>
              {loading ? "Adding Stock..." : "Add Stock to Central Stores"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="new" className="space-y-4 mt-4">
          <form onSubmit={handleAddNewItem} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newItemName">Item Name *</Label>
                <Input
                  id="newItemName"
                  value={newFormData.name}
                  onChange={(e) => setNewFormData({ ...newFormData, name: e.target.value })}
                  placeholder="e.g., HP Laptop Battery"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newCategory">Category *</Label>
                <Select 
                  value={newFormData.category} 
                  onValueChange={(value) => setNewFormData({ ...newFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select or add category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="custom">+ Add New Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newFormData.category === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customCategory">New Category Name *</Label>
                <Input
                  id="customCategory"
                  value={newFormData.customCategory}
                  onChange={(e) => setNewFormData({ ...newFormData, customCategory: e.target.value })}
                  placeholder="Enter new category name"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newDescription">Description</Label>
              <Input
                id="newDescription"
                value={newFormData.description}
                onChange={(e) => setNewFormData({ ...newFormData, description: e.target.value })}
                placeholder="Brief description of the item"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newSku">SKU</Label>
                <Input
                  id="newSku"
                  value={newFormData.sku}
                  onChange={(e) => setNewFormData({ ...newFormData, sku: e.target.value })}
                  placeholder="Auto-generated"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newQuantity">Quantity *</Label>
                <Input
                  id="newQuantity"
                  type="number"
                  value={newFormData.quantity}
                  onChange={(e) => setNewFormData({ ...newFormData, quantity: e.target.value })}
                  placeholder="0"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newUnit">Unit</Label>
                <Select 
                  value={newFormData.unit} 
                  onValueChange={(value) => setNewFormData({ ...newFormData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pieces</SelectItem>
                    <SelectItem value="units">Units</SelectItem>
                    <SelectItem value="boxes">Boxes</SelectItem>
                    <SelectItem value="packs">Packs</SelectItem>
                    <SelectItem value="rolls">Rolls</SelectItem>
                    <SelectItem value="sets">Sets</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPrice">Unit Price</Label>
                <Input
                  id="newPrice"
                  type="number"
                  step="0.01"
                  value={newFormData.unitPrice}
                  onChange={(e) => setNewFormData({ ...newFormData, unitPrice: e.target.value })}
                  placeholder="0.00"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newSupplier">Supplier</Label>
                <Input
                  id="newSupplier"
                  value={newFormData.supplier}
                  onChange={(e) => setNewFormData({ ...newFormData, supplier: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newReference">Reference Number</Label>
                <Input
                  id="newReference"
                  value={newFormData.reference_number}
                  onChange={(e) => setNewFormData({ ...newFormData, reference_number: e.target.value })}
                  placeholder="e.g., Invoice number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newNotes">Notes</Label>
              <Textarea
                id="newNotes"
                value={newFormData.notes}
                onChange={(e) => setNewFormData({ ...newFormData, notes: e.target.value })}
                placeholder="Any additional notes"
                rows={2}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding Item..." : "Add New Item to Central Stores"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
