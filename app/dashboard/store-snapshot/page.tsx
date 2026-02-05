"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { canSeeAllLocations } from "@/lib/location-filter"

interface InventoryItem {
  id: string
  item_name: string
  name: string
  category: string
  siv_number?: string
  sku?: string
  quantity_in_stock: number
  quantity: number
  reorder_level: number
  location: string
  created_at: string
}

export default function StoreSnapshotPage() {
  const { user } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Users with "user" role have view-only access to Central Stores stock levels
  const isViewOnlyUser = user?.role === "user"

  useEffect(() => {
    async function fetchInventory() {
      try {
        const supabase = createClient()

        let query = supabase.from("store_items").select("*").order("name", { ascending: true })

        // Users with "user" role can only see Central Stores inventory
        if (isViewOnlyUser) {
          console.log("[v0] User role - showing Central Stores only")
          query = query.eq("location", "Central Stores")
        } else if (user && !canSeeAllLocations(user) && user.location) {
          console.log("[v0] Filtering store snapshot by location:", user.location, "+ Central Stores")
          query = query.or(`location.eq.${user.location},location.eq.Central Stores`)
        }

        const { data, error } = await query

        if (error) {
          console.error("[v0] Error fetching inventory:", error)
          return
        }

        console.log("[v0] Fetched store items for snapshot:", data)
        setInventory(data || [])
      } catch (error) {
        console.error("[v0] Error loading inventory:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [user, isViewOnlyUser])

  const filteredInventory = inventory

  const lowStockItems = filteredInventory.filter(
    (item) =>
      (item.quantity || item.quantity_in_stock) <= item.reorder_level && (item.quantity || item.quantity_in_stock) > 0,
  )
  const outOfStockItems = filteredInventory.filter((item) => (item.quantity || item.quantity_in_stock) === 0)
  const inStockItems = filteredInventory.filter(
    (item) => (item.quantity || item.quantity_in_stock) > item.reorder_level,
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading inventory data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">IT Store Stock Levels</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isViewOnlyUser 
            ? "View-only access to Central Stores stock levels" 
            : `View current stock levels for IT items at ${user?.location || "your location"}`}
        </p>
      </div>
      
      {/* View-Only Notice for User Role */}
      {isViewOnlyUser && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="flex items-start gap-3 pt-6">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">View-Only Access</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                You have read-only access to Central Stores stock levels. You cannot modify inventory or request items. 
                To request IT equipment or supplies, please contact your IT Head or Regional IT Head.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInventory.length}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{inStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Above reorder level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Need reordering soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Urgent action needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Level Tables */}
      <div className="space-y-6">
        {/* Out of Stock Items */}
        {outOfStockItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Out of Stock Items
              </CardTitle>
              <CardDescription>Items that need immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {outOfStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.name || item.item_name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Category: {item.category} | SKU: {item.sku || item.siv_number || "N/A"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Location: {item.location}</p>
                    </div>
                    <Badge variant="destructive">Out of Stock</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Low Stock Items */}
        {lowStockItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Low Stock Items
              </CardTitle>
              <CardDescription>Items approaching reorder level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.name || item.item_name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Category: {item.category} | SKU: {item.sku || item.siv_number || "N/A"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Location: {item.location}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Low: {item.quantity || item.quantity_in_stock} left
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">Reorder at: {item.reorder_level}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* In Stock Items */}
        {inStockItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                In Stock Items
              </CardTitle>
              <CardDescription>Items with adequate stock levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.name || item.item_name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Category: {item.category} | SKU: {item.sku || item.siv_number || "N/A"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Location: {item.location}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        In Stock: {item.quantity || item.quantity_in_stock}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">Reorder at: {item.reorder_level}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredInventory.length === 0 && (
          <Card className="bg-muted/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">No Inventory Items Found</h3>
              <p className="text-sm text-muted-foreground text-center">
                There are no inventory items to display for your location.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Stock Snapshot View</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              This is a read-only view of current stock levels. To request items or manage inventory, please contact the
              IT Store Head or submit a store requisition.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
