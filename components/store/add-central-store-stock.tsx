"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Plus,
  Package,
  AlertCircle,
  CheckCircle,
  Warehouse,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface StockItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  sku?: string
  description?: string
  unit_price?: number
}

const CATEGORIES = [
  "Computers",
  "Printers",
  "Network Equipment",
  "Peripherals",
  "Accessories",
  "Software",
  "Consumables",
  "Hardware",
  "Toners",
  "Other",
]

const UNITS = ["pcs", "units", "boxes", "sets", "pairs", "reams", "bottles", "rolls"]

export function AddCentralStoreStock({ onStockAdded }: { onStockAdded?: () => void }) {
  const { user } = useAuth()
  const supabase = createClient()
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("existing")
  const [loading, setLoading] = useState(false)
  const [itemsLoading, setItemsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [centralStoreItems, setCentralStoreItems] = useState<StockItem[]>([])

  // Existing item form
  const [selectedItemId, setSelectedItemId] = useState("")
  const [addQuantity, setAddQuantity] = useState("")
  const [addNotes, setAddNotes] = useState("")

  // New item form
  const [newItemForm, setNewItemForm] = useState({
    name: "",
    description: "",
    category: "",
    customCategory: "",
    sku: "",
    quantity: "",
    unit: "pcs",
    unit_price: "",
    notes: "",
  })

  // Check if user has permission
  const canAddStock = user?.role === "admin" || user?.role === "it_store_head"

  useEffect(() => {
    if (dialogOpen) {
      loadCentralStoreItems()
    }
  }, [dialogOpen])

  const loadCentralStoreItems = async () => {
    try {
      setItemsLoading(true)
      const { data, error } = await supabase
        .from("store_items")
        .select("*")
        .or("location.eq.central_stores,location.eq.Central Stores")
        .order("name")

      if (error) {
        console.error("[v0] Error loading central store items:", error)
        return
      }

      setCentralStoreItems(data || [])
    } catch (err) {
      console.error("[v0] Error:", err)
    } finally {
      setItemsLoading(false)
    }
  }

  const handleAddToExisting = async () => {
    if (!selectedItemId) {
      setError("Please select an item")
      return
    }
    if (!addQuantity || parseInt(addQuantity) <= 0) {
      setError("Please enter a valid quantity")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const selectedItem = centralStoreItems.find(item => item.id === selectedItemId)
      if (!selectedItem) {
        setError("Selected item not found")
        return
      }

      const newQuantity = selectedItem.quantity + parseInt(addQuantity)

      // Update stock quantity
      const { error: updateError } = await supabase
        .from("store_items")
        .update({
          quantity: newQuantity,
          quantity_in_stock: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedItemId)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Record the stock transaction
      await supabase.from("stock_transactions").insert({
        item_id: selectedItemId,
        item_name: selectedItem.name,
        transaction_type: "stock_addition",
        quantity: parseInt(addQuantity),
        unit: selectedItem.unit,
        location_name: "Central Stores",
        notes: addNotes || `Stock added to Central Stores by ${user?.full_name || user?.name}`,
        performed_by: user?.full_name || user?.name || "System",
        created_at: new Date().toISOString(),
      })

      setSuccess(`Stock successfully updated in Central Store. Added ${addQuantity} ${selectedItem.unit} of ${selectedItem.name}. New total: ${newQuantity}`)
      toast({
        title: "📦 Stock Added Successfully",
        description: `Added ${addQuantity} ${selectedItem.unit} of ${selectedItem.name} to Central Store`,
      })
      
      // Reset form
      setSelectedItemId("")
      setAddQuantity("")
      setAddNotes("")
      
      // Reload items to show updated quantities
      await loadCentralStoreItems()
      
      // Call parent callback if provided
      if (onStockAdded) {
        onStockAdded()
      }

      // Close dialog after delay
      setTimeout(() => {
        setDialogOpen(false)
        setSuccess("")
      }, 2500)

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

  const handleAddNewItem = async () => {
    // Validation
    if (!newItemForm.name.trim()) {
      setError("Please enter the item name")
      return
    }
    if (!newItemForm.category && !newItemForm.customCategory) {
      setError("Please select or enter a category")
      return
    }
    if (!newItemForm.quantity || parseInt(newItemForm.quantity) <= 0) {
      setError("Please enter a valid quantity")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const category = newItemForm.customCategory || newItemForm.category
      const sku = newItemForm.sku || `SKU-${Date.now()}`

      // Check if item already exists in Central Stores
      const { data: existingItem } = await supabase
        .from("store_items")
        .select("id, name")
        .eq("name", newItemForm.name.trim())
        .or("location.eq.central_stores,location.eq.Central Stores")
        .maybeSingle()

      if (existingItem) {
        setError(`An item with name "${newItemForm.name}" already exists in Central Stores. Please use the "Add to Existing Item" tab.`)
        return
      }

      // Insert new item
      const { data: newItem, error: insertError } = await supabase
        .from("store_items")
        .insert({
          name: newItemForm.name.trim(),
          description: newItemForm.description.trim(),
          category: category,
          sku: sku,
          quantity: parseInt(newItemForm.quantity),
          quantity_in_stock: parseInt(newItemForm.quantity),
          unit: newItemForm.unit,
          unit_price: newItemForm.unit_price ? parseFloat(newItemForm.unit_price) : 0,
          location: "central_stores",
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(insertError.message)
      }

      // Record the stock transaction
      await supabase.from("stock_transactions").insert({
        item_id: newItem.id,
        item_name: newItemForm.name.trim(),
        transaction_type: "initial_stock",
        quantity: parseInt(newItemForm.quantity),
        unit: newItemForm.unit,
        location_name: "Central Stores",
        notes: newItemForm.notes || `New item added to Central Stores by ${user?.full_name || user?.name}`,
        performed_by: user?.full_name || user?.name || "System",
        created_at: new Date().toISOString(),
      })

      setSuccess(`Stock successfully updated in Central Store. New item "${newItemForm.name}" added with ${newItemForm.quantity} ${newItemForm.unit}.`)
      toast({
        title: "✅ Item Created Successfully",
        description: `New item "${newItemForm.name}" added with ${newItemForm.quantity} ${newItemForm.unit}`,
      })
      
      // Reset form
      setNewItemForm({
        name: "",
        description: "",
        category: "",
        customCategory: "",
        sku: "",
        quantity: "",
        unit: "pcs",
        unit_price: "",
        notes: "",
      })
      
      // Reload items
      await loadCentralStoreItems()
      
      // Call parent callback if provided
      if (onStockAdded) {
        onStockAdded()
      }

      // Close dialog after delay
      setTimeout(() => {
        setDialogOpen(false)
        setSuccess("")
      }, 2500)

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
    return null
  }

  const selectedItem = centralStoreItems.find(item => item.id === selectedItemId)

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-green-600 hover:bg-green-700">
          <Warehouse className="h-4 w-4 mr-2" />
          Add Stock to Central Store
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-green-600" />
            Add Stock to Central Store
          </DialogTitle>
          <DialogDescription>
            Add new stock items or increase quantity of existing items in Central Stores inventory.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg flex items-center gap-2 border border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            {itemsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading Central Store items...
              </div>
            ) : centralStoreItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No items in Central Store yet.</p>
                <p className="text-sm">Use the "Add New Item" tab to create your first item.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select Item *</Label>
                  <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an existing item to add stock" />
                    </SelectTrigger>
                    <SelectContent>
                      {centralStoreItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <span>{item.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {item.quantity} {item.unit}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedItem && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <span className="ml-2 font-medium">{selectedItem.category}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Current Stock:</span>
                          <Badge variant="secondary" className="ml-2">
                            {selectedItem.quantity} {selectedItem.unit}
                          </Badge>
                        </div>
                        {selectedItem.sku && (
                          <div>
                            <span className="text-muted-foreground">SKU:</span>
                            <span className="ml-2 font-medium">{selectedItem.sku}</span>
                          </div>
                        )}
                        {selectedItem.description && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Description:</span>
                            <span className="ml-2">{selectedItem.description}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="addQuantity">Quantity to Add *</Label>
                    <Input
                      id="addQuantity"
                      type="number"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(e.target.value)}
                      placeholder="Enter quantity"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input 
                      value={selectedItem?.unit || "pcs"} 
                      disabled 
                      className="bg-muted"
                    />
                  </div>
                </div>

                {selectedItem && addQuantity && parseInt(addQuantity) > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Preview:</strong> Adding {addQuantity} {selectedItem.unit} will increase total stock from{" "}
                      <Badge variant="outline">{selectedItem.quantity}</Badge> to{" "}
                      <Badge variant="default" className="bg-green-600">
                        {selectedItem.quantity + parseInt(addQuantity)}
                      </Badge> {selectedItem.unit}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="addNotes">Notes (Optional)</Label>
                  <Textarea
                    id="addNotes"
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    placeholder="Add any notes about this stock addition (e.g., supplier, invoice number)"
                    rows={2}
                  />
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddToExisting} 
                    disabled={loading || !selectedItemId || !addQuantity}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "Adding..." : "Add Stock"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newItemName">Item Name *</Label>
                <Input
                  id="newItemName"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  placeholder="e.g., HP Toner 26A"
                />
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={newItemForm.category} 
                  onValueChange={(value) => setNewItemForm({ ...newItemForm, category: value, customCategory: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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

            {newItemForm.category === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customCategory">New Category Name *</Label>
                <Input
                  id="customCategory"
                  value={newItemForm.customCategory}
                  onChange={(e) => setNewItemForm({ ...newItemForm, customCategory: e.target.value })}
                  placeholder="Enter new category name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="newItemDesc">Description</Label>
              <Input
                id="newItemDesc"
                value={newItemForm.description}
                onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
                placeholder="Brief description of the item"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newItemSku">SKU</Label>
                <Input
                  id="newItemSku"
                  value={newItemForm.sku}
                  onChange={(e) => setNewItemForm({ ...newItemForm, sku: e.target.value })}
                  placeholder="Auto-generated"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newItemQty">Quantity *</Label>
                <Input
                  id="newItemQty"
                  type="number"
                  value={newItemForm.quantity}
                  onChange={(e) => setNewItemForm({ ...newItemForm, quantity: e.target.value })}
                  placeholder="0"
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label>Unit</Label>
                <Select 
                  value={newItemForm.unit} 
                  onValueChange={(value) => setNewItemForm({ ...newItemForm, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newItemPrice">Unit Price (Optional)</Label>
              <Input
                id="newItemPrice"
                type="number"
                step="0.01"
                value={newItemForm.unit_price}
                onChange={(e) => setNewItemForm({ ...newItemForm, unit_price: e.target.value })}
                placeholder="0.00"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newItemNotes">Notes (Optional)</Label>
              <Textarea
                id="newItemNotes"
                value={newItemForm.notes}
                onChange={(e) => setNewItemForm({ ...newItemForm, notes: e.target.value })}
                placeholder="Add any notes about this item"
                rows={2}
              />
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                This item will be added to <strong>Central Stores</strong> inventory only.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddNewItem} 
                disabled={loading || !newItemForm.name || (!newItemForm.category && !newItemForm.customCategory) || !newItemForm.quantity}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Adding..." : "Add New Item"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
