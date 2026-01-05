"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, AlertTriangle, CheckCircle2, Info } from "lucide-react"
import { getStoreInventory } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"

export default function StoreSnapshotPage() {
  const { user } = useAuth()
  const inventory = getStoreInventory()

  // Filter inventory by user location if not head office
  const filteredInventory =
    user?.location === "head_office" ? inventory : inventory.filter((item) => item.location === user?.location)

  const lowStockItems = filteredInventory.filter((item) => item.quantity <= item.reorderLevel)
  const outOfStockItems = filteredInventory.filter((item) => item.quantity === 0)
  const inStockItems = filteredInventory.filter((item) => item.quantity > item.reorderLevel)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">IT Store Stock Levels</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View current stock levels for IT items at {user?.location?.replace(/_/g, " ") || "your location"}
        </p>
      </div>

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
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Category: {item.category} | SKU: {item.sku}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Location: {item.location.replace(/_/g, " ")}
                      </p>
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
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Category: {item.category} | SKU: {item.sku}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Location: {item.location.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Low: {item.quantity} left
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">Reorder at: {item.reorderLevel}</p>
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
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Category: {item.category} | SKU: {item.sku}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Location: {item.location.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        In Stock: {item.quantity}
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">Reorder at: {item.reorderLevel}</p>
                    </div>
                  </div>
                ))}
              </div>
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
