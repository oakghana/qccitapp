"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Download,
  FileSpreadsheet,
  FileText,
  Package,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Plus,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { canSeeAllLocations } from "@/lib/location-filter"
import { toast } from "sonner"
import { LOCATIONS } from "@/lib/locations"

interface StoreItem {
  id: string
  name: string
  sku: string
  category: string
  quantity: number
  reorder_level: number
  unit: string
  location: string
  supplier?: string
}

export default function StoreInventoryPage() {
  const [inventory, setInventory] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const { user } = useAuth()

  const canSeeAll = user ? canSeeAllLocations(user) : false
  const userLocation = user?.location || ""

  // Available locations for dropdown
  const availableLocations = canSeeAll
    ? ["all", ...Object.keys(LOCATIONS)]
    : userLocation
    ? [userLocation]
    : ["all"]

  useEffect(() => {
    loadInventory()
  }, [selectedLocation])

  const loadInventory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        location: selectedLocation === "all" ? "" : selectedLocation,
        canSeeAll: String(canSeeAll),
      })

      const response = await fetch(`/api/store/items?${params}`)
      const result = await response.json()

      if (result.error) {
        toast.error(result.error)
        return
      }

      setInventory(result.data || [])
    } catch (error) {
      console.error("[v0] Error loading inventory:", error)
      toast.error("Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }

  // Filter inventory by location
  const getLocationInventory = (location: string) => {
    if (location === "all") return inventory
    return inventory.filter((item) => item.location?.toLowerCase() === location.toLowerCase())
  }

  // Get items needing reorder by location
  const getItemsNeedingReorder = (location: string) => {
    const items = getLocationInventory(location)
    return items.filter((item) => item.quantity <= item.reorder_level)
  }

  // Calculate statistics
  const getLocationStats = (location: string) => {
    const items = getLocationInventory(location)
    return {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      lowStock: items.filter((item) => item.quantity <= item.reorder_level && item.quantity > 0).length,
      outOfStock: items.filter((item) => item.quantity === 0).length,
      itemsNeedingReorder: getItemsNeedingReorder(location),
    }
  }

  // Export to Excel
  const exportToExcel = (data: StoreItem[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error("No data to export")
      return
    }

    const headers = ["Item Name", "SKU", "Category", "Location", "Current Qty", "Reorder Level", "Unit", "Status"].join(",")
    const rows = data.map((item) => {
      const status = item.quantity === 0 ? "Out of Stock" : item.quantity <= item.reorder_level ? "Low Stock" : "In Stock"
      return [
        `"${item.name}"`,
        item.sku,
        item.category,
        item.location,
        item.quantity,
        item.reorder_level,
        item.unit,
        status,
      ].join(",")
    })

    const csv = [headers, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Report exported successfully")
  }

  // Export to PDF (simplified - creates downloadable text)
  const exportToPDF = (data: StoreItem[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error("No data to export")
      return
    }

    let content = `IT STORE INVENTORY REPORT\n`
    content += `Location: ${selectedLocation === "all" ? "All Locations" : LOCATIONS[selectedLocation as keyof typeof LOCATIONS]}\n`
    content += `Generated: ${new Date().toLocaleString()}\n\n`
    content += `${"=".repeat(80)}\n\n`

    data.forEach((item) => {
      const status = item.quantity === 0 ? "OUT OF STOCK" : item.quantity <= item.reorder_level ? "LOW STOCK" : "IN STOCK"
      content += `Item: ${item.name}\n`
      content += `SKU: ${item.sku} | Category: ${item.category}\n`
      content += `Location: ${item.location} | Quantity: ${item.quantity} ${item.unit}\n`
      content += `Reorder Level: ${item.reorder_level} | Status: ${status}\n`
      content += `${"-".repeat(80)}\n`
    })

    const blob = new Blob([content], { type: "text/plain" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename.replace(".pdf", ".txt")
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Report exported successfully")
  }

  const stats = getLocationStats(selectedLocation)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IT Store Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive inventory management across all locations
          </p>
        </div>
        
        {canSeeAll && (
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {Object.entries(LOCATIONS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Quantity</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.totalQuantity}</div>
            <p className="text-xs text-muted-foreground mt-1">Units in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground mt-1">Below reorder level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.outOfStock}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate action</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="reorder" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Needs Reorder ({stats.itemsNeedingReorder.length})
          </TabsTrigger>
          <TabsTrigger value="all-items" className="gap-2">
            <Package className="h-4 w-4" />
            All Items
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Inventory Overview</CardTitle>
                <CardDescription>
                  Stock distribution and status for {selectedLocation === "all" ? "all locations" : LOCATIONS[selectedLocation as keyof typeof LOCATIONS]}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToExcel(getLocationInventory(selectedLocation), `inventory-overview-${selectedLocation}-${new Date().toISOString().split("T")[0]}.csv`)}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToPDF(getLocationInventory(selectedLocation), `inventory-overview-${selectedLocation}-${new Date().toISOString().split("T")[0]}.pdf`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading inventory...</div>
              ) : getLocationInventory(selectedLocation).length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold">No items in inventory</p>
                  <p className="text-sm text-muted-foreground">Add items to get started</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Category Breakdown */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">By Category</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(
                        getLocationInventory(selectedLocation).reduce((acc, item) => {
                          acc[item.category] = (acc[item.category] || 0) + 1
                          return acc
                        }, {} as Record<string, number>)
                      ).map(([category, count]) => (
                        <div key={category} className="border rounded-lg p-3">
                          <div className="text-xs text-muted-foreground capitalize">{category}</div>
                          <div className="text-2xl font-bold">{count}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Items */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Recent Items</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getLocationInventory(selectedLocation).slice(0, 10).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell className="text-right">
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell>
                              {item.quantity === 0 ? (
                                <Badge variant="destructive">Out of Stock</Badge>
                              ) : item.quantity <= item.reorder_level ? (
                                <Badge className="bg-orange-600">Low Stock</Badge>
                              ) : (
                                <Badge className="bg-green-600">In Stock</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Needing Reorder Tab */}
        <TabsContent value="reorder" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Items Needing Reorder
                </CardTitle>
                <CardDescription>
                  Items at or below reorder level for {selectedLocation === "all" ? "all locations" : LOCATIONS[selectedLocation as keyof typeof LOCATIONS]}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToExcel(stats.itemsNeedingReorder, `items-needing-reorder-${selectedLocation}-${new Date().toISOString().split("T")[0]}.csv`)}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToPDF(stats.itemsNeedingReorder, `items-needing-reorder-${selectedLocation}-${new Date().toISOString().split("T")[0]}.pdf`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : stats.itemsNeedingReorder.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-green-600 mb-4" />
                  <p className="text-lg font-semibold">All items well stocked</p>
                  <p className="text-sm text-muted-foreground">No items require immediate reordering</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Reorder At</TableHead>
                      <TableHead className="text-right">Needed</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.itemsNeedingReorder.map((item) => {
                      const shortage = Math.max(0, item.reorder_level - item.quantity)
                      const recommended = shortage + Math.ceil(item.reorder_level * 0.5)
                      const priority = item.quantity === 0 ? "Critical" : item.quantity < item.reorder_level * 0.5 ? "High" : "Medium"
                      const priorityColor = priority === "Critical" ? "destructive" : priority === "High" ? "default" : "secondary"

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{item.sku}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {item.reorder_level} {item.unit}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-blue-600">
                            {recommended} {item.unit}
                          </TableCell>
                          <TableCell>
                            <Badge variant={priorityColor}>{priority}</Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Items Tab */}
        <TabsContent value="all-items" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Inventory Items</CardTitle>
                <CardDescription>
                  Complete inventory list for {selectedLocation === "all" ? "all locations" : LOCATIONS[selectedLocation as keyof typeof LOCATIONS]}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToExcel(getLocationInventory(selectedLocation), `all-items-${selectedLocation}-${new Date().toISOString().split("T")[0]}.csv`)}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToPDF(getLocationInventory(selectedLocation), `all-items-${selectedLocation}-${new Date().toISOString().split("T")[0]}.pdf`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : getLocationInventory(selectedLocation).length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold">No items found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Reorder Level</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getLocationInventory(selectedLocation).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.sku}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{item.location}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.reorder_level} {item.unit}
                        </TableCell>
                        <TableCell>
                          {item.quantity === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : item.quantity <= item.reorder_level ? (
                            <Badge className="bg-orange-600">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-green-600">In Stock</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
