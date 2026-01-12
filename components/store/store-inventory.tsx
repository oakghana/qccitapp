"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Download,
  History,
  ExternalLink,
} from "lucide-react"
import { AddStoreItemForm } from "./add-store-item-form"
import { StoreReceiptForm } from "./store-receipt-form"
import { StockCardDetailModal } from "./stock-card-detail-modal"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { canSeeAllLocations } from "@/lib/location-filter"
import { useRouter } from "next/navigation"

interface StoreItem {
  id: string
  itemName: string
  category: "hardware" | "software" | "accessories" | "consumables" | "peripherals"
  quantity: number
  reorderLevel: number
  unit: string
  location: string
  lastUpdated: string
}

const categoryIcons = {
  hardware: Package,
  software: Package,
  accessories: Package,
  consumables: Package,
  peripherals: Package,
}

export function StoreInventory() {
  const [inventory, setInventory] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null)
  const { user } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      let query = supabase.from("store_items").select("*").order("created_at", { ascending: false })

      if (user && !canSeeAllLocations(user) && user.location) {
        query = query.or(`location.eq.${user.location},location.eq.Central Stores`)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error loading inventory:", error)
        return
      }

      console.log("[v0] Loaded inventory from Supabase:", data)

      const mappedInventory: StoreItem[] = data.map((item: any) => ({
        id: item.id,
        itemName: item.name,
        category: item.category || "hardware",
        quantity: item.quantity || 0,
        reorderLevel: item.reorder_level || 0,
        unit: item.unit || "pcs",
        location: item.location || "Head Office",
        lastUpdated: item.updated_at || item.created_at,
      }))

      setInventory(mappedInventory)
    } catch (error) {
      console.error("[v0] Error loading inventory:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const lowStockItems = inventory.filter((item) => item.quantity <= item.reorderLevel)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading inventory...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">IT Store Inventory</h1>
          <p className="text-muted-foreground">Manage IT items, accessories, and consumables</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/store-overview")}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Stock Levels
          </Button>
          <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Receive Items
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Store Receipt</DialogTitle>
                <DialogDescription>Record items received into the IT store</DialogDescription>
              </DialogHeader>
              <StoreReceiptForm onSubmit={() => setReceiptOpen(false)} />
            </DialogContent>
          </Dialog>
          <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Store Item</DialogTitle>
                <DialogDescription>Register a new item in the IT store inventory</DialogDescription>
              </DialogHeader>
              <AddStoreItemForm
                onSubmit={() => {
                  setAddItemOpen(false)
                  loadInventory()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-800 dark:text-orange-300">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>{lowStockItems.length} item(s) below reorder level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {item.quantity} {item.unit} | Reorder at: {item.reorderLevel} {item.unit}
                    </p>
                  </div>
                  <Badge variant="destructive">Low Stock</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="consumables">Consumables</SelectItem>
                <SelectItem value="peripherals">Peripherals</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredInventory.map((item) => {
          const IconComponent = categoryIcons[item.category as keyof typeof categoryIcons] || Package
          const isLowStock = item.quantity <= item.reorderLevel
          return (
            <Card
              key={item.id}
              className={`${isLowStock ? "border-orange-200" : ""} cursor-pointer hover:shadow-lg transition-shadow`}
              onClick={() => setSelectedItem(item)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.itemName}</CardTitle>
                      <CardDescription className="text-sm">{item.id}</CardDescription>
                    </div>
                  </div>
                  <History className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stock Level</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">
                      {item.quantity} {item.unit}
                    </span>
                    {isLowStock ? (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reorder Level</span>
                  <span className="text-sm font-medium">
                    {item.reorderLevel} {item.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-medium">{item.location}</span>
                </div>
                {isLowStock && (
                  <Badge variant="destructive" className="w-full justify-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Low Stock
                  </Badge>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedItem && (
        <StockCardDetailModal item={selectedItem} open={!!selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  )
}
