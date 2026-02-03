"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Package, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface StockItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  sku?: string
}

interface AddStockToCentralStoreProps {
  onStockAdded?: () => void
}

export function AddStockToCentralStore({ onStockAdded }: AddStockToCentralStoreProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [existingItems, setExistingItems] = useState<StockItem[]>([])
  const [categories, setCategories] = useState<string[]>([])
  
  // Form state
  const [mode, setMode] = useState<"existing" | "new">("existing")
  const [selectedItemId, setSelectedItemId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")
  
  // New item form state
  const [newItemName, setNewItemName] = useState("")
  const [newItemCategory, setNewItemCategory] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newItemUnit, setNewItemUnit] = useState("pcs")
  const [newItemSku, setNewItemSku] = useState("")
  const [newItemDescription, setNewItemDescription] = useState("")
  const [reorderLevel, setReorderLevel] = useState("5")

  // Check if user can add stock (admin or it_store_head only)
  const canAddStock = user?.role === "admin" || user?.role === "it_store_head"

  useEffect(() => {
    if (open) {
      loadExistingItems()
    }
  }, [open])

  const loadExistingItems = async () => {
    try {
      setLoadingItems(true)
      const params = new URLSearchParams({
        location: "central_stores",
        canSeeAll: "true",
      })
      
      const response = await fetch(`/api/store/items?${params}`)
      const result = await response.json()

      if (response.ok && result.items) {
        setExistingItems(result.items)
        // Extract unique categories
        const uniqueCategories = [...new Set(result.items.map((item: StockItem) => item.category).filter(Boolean))]
        setCategories(uniqueCategories as string[])
      }
    } catch (error) {
      console.error("[v0] Error loading items:", error)
    } finally {
      setLoadingItems(false)
    }
  }

  const generateSku = () => {
    const prefix = newItemCategory.substring(0, 3).toUpperCase() || "ITM"
    const timestamp = Date.now().toString().slice(-10)
    return `SKU-${prefix}-${timestamp}`
  }

  const handleSubmit = async () => {
    setError("")
    setSuccess("")

    // Validation
    if (mode === "existing") {
      if (!selectedItemId) {
        setError("Please select an item")
        return
      }
    } else {
      if (!newItemName.trim()) {
        setError("Please enter the item name")
        return
      }
      const category = newItemCategory === "new" ? newCategory : newItemCategory
      if (!category) {
        setError("Please select or enter a category")
        return
      }
    }

    if (!quantity || parseInt(quantity) <= 0) {
      setError("Please enter a valid quantity")
      return
    }

    setLoading(true)

    try {
      if (mode === "existing") {
        // Update existing item quantity
        const response = await fetch("/api/store/add-stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: selectedItemId,
            quantity: parseInt(quantity),
            location: "central_stores",
            notes: notes,
            addedBy: user?.full_name || user?.name || user?.username,
            addedByRole: user?.role,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          setError(result.error || "Failed to add stock")
          toast({
            title: "❌ Failed to Add Stock",
            description: result.error || "Failed to add stock to Central Store",
            variant: "destructive",
          })
          return
        }

        setSuccess(`Successfully added ${quantity} units. Stock updated in Central Store.`)
        toast({
          title: "📦 Stock Added Successfully",
          description: `Added ${quantity} units to Central Store inventory`,
        })
      } else {
        // Create new item
        const category = newItemCategory === "new" ? newCategory : newItemCategory
        const sku = newItemSku || generateSku()

        const response = await fetch("/api/store/add-stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isNewItem: true,
            name: newItemName.trim(),
            category: category,
            quantity: parseInt(quantity),
            unit: newItemUnit,
            sku: sku,
            description: newItemDescription,
            reorder_level: parseInt(reorderLevel) || 5,
            location: "central_stores",
            notes: notes,
            addedBy: user?.full_name || user?.name || user?.username,
            addedByRole: user?.role,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          setError(result.error || "Failed to add new item")
          toast({
            title: "❌ Failed to Create Item",
            description: result.error || "Failed to create new item in Central Store",
            variant: "destructive",
          })
          return
        }

        setSuccess(`Successfully created "${newItemName}" with ${quantity} ${newItemUnit} in Central Store.`)
        toast({
          title: "✅ Item Created Successfully",
          description: `Created "${newItemName}" with ${quantity} ${newItemUnit} in Central Store`,
        })
      }

      // Notify parent and refresh
      if (onStockAdded) {
        onStockAdded()
      }

      // Reset form after short delay
      setTimeout(() => {
        resetForm()
        setOpen(false)
        setSuccess("")
      }, 2000)

    } catch (error) {
      console.error("[v0] Error adding stock:", error)
      setError("An error occurred while adding stock")
      toast({
        title: "❌ Error",
        description: "An unexpected error occurred while adding stock",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setMode("existing")
    setSelectedItemId("")
    setQuantity("")
    setNotes("")
    setNewItemName("")
    setNewItemCategory("")
    setNewCategory("")
    setNewItemUnit("pcs")
    setNewItemSku("")
    setNewItemDescription("")
    setReorderLevel("5")
    setError("")
    setSuccess("")
  }

  if (!canAddStock) {
    return null
  }

  const selectedItem = existingItems.find(item => item.id === selectedItemId)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Package className="h-4 w-4" />
          Add Stock to Central Store
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add Stock to Central Store
          </DialogTitle>
          <DialogDescription>
            Increase stock levels in the Central Store by adding to existing items or creating new inventory items.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="space-y-2">
            <Label>Stock Addition Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "existing" ? "default" : "outline"}
                onClick={() => setMode("existing")}
                className="flex-1"
              >
                Add to Existing Item
              </Button>
              <Button
                type="button"
                variant={mode === "new" ? "default" : "outline"}
                onClick={() => setMode("new")}
                className="flex-1"
              >
                Create New Item
              </Button>
            </div>
          </div>

          {mode === "existing" ? (
            <>
              {/* Existing Item Selection */}
              <div className="space-y-2">
                <Label htmlFor="item">Select Item *</Label>
                {loadingItems ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading items...
                  </div>
                ) : (
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an item to add stock" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {item.quantity} {item.unit}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedItem && (
                  <p className="text-xs text-muted-foreground">
                    Current stock: {selectedItem.quantity} {selectedItem.unit} | Category: {selectedItem.category}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* New Item Form */}
              <div className="space-y-2">
                <Label htmlFor="newItemName">Item Name *</Label>
                <Input
                  id="newItemName"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g., HP LaserJet Toner 85A"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                      <SelectItem value="new">+ Add New Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <Select value={newItemUnit} onValueChange={setNewItemUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                      <SelectItem value="set">Set</SelectItem>
                      <SelectItem value="roll">Roll</SelectItem>
                      <SelectItem value="ream">Ream</SelectItem>
                      <SelectItem value="carton">Carton</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newItemCategory === "new" && (
                <div className="space-y-2">
                  <Label htmlFor="newCategory">New Category Name *</Label>
                  <Input
                    id="newCategory"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter new category name"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU (Optional)</Label>
                  <Input
                    id="sku"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    placeholder="Auto-generated if empty"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reorderLevel">Reorder Level</Label>
                  <Input
                    id="reorderLevel"
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder="Brief description of the item"
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Common Fields */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity to Add *</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Purchase order number, supplier info"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
