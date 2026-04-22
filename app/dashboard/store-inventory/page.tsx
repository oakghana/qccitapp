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
  TrendingDown,
  BarChart3,
  Plus,
  MapPin,
  Building,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Loader2,
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

interface Analytics {
  summary: {
    totalItems: number
    totalQuantity: number
    lowStockCount: number
    outOfStockCount: number
    totalIssues: number
    totalReceipts: number
    totalAssignments: number
    pendingRequisitions: number
  }
  stockByLocation: Record<string, { items: number; quantity: number; value: number }>
  stockByCategory: Record<string, number>
  issuesByDepartment: Record<string, number>
  movementTrends: Array<{ date: string; issues: number; receipts: number }>
  topIssuedItems: Array<{ name: string; count: number }>
  lowStockItems: Array<{ id: string; name: string; quantity: number; reorderLevel: number; location: string; category: string }>
  recentTransactionsSummary: Record<string, Array<{ location: string; summary: string }>>
}

export default function StoreInventoryPage() {
  const [inventory, setInventory] = useState<StoreItem[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month")
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
    loadAnalytics()
  }, [selectedLocation, selectedPeriod])

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

  const loadAnalytics = async () => {
    setAnalyticsLoading(true)
    try {
      const params = new URLSearchParams({
        period: selectedPeriod,
        location: selectedLocation === "all" ? "" : selectedLocation,
      })
      const response = await fetch(`/api/store/analytics?${params}`)
      const result = await response.json()
      if (!result.error) {
        setAnalytics(result)
      }
    } catch (error) {
      console.error("[v0] Error loading analytics:", error)
    } finally {
      setAnalyticsLoading(false)
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
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-stone-50 p-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IT Store Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive inventory management across all locations
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* Period Filter */}
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px] input-modern">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          
          {canSeeAll && (
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[200px] input-modern">
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
      </div>

      {/* Summary Cards - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-emerald-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics?.summary?.totalItems || stats.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique items in inventory</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Quantity</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-800" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-800">{analytics?.summary?.totalQuantity || stats.totalQuantity}</div>
            <p className="text-xs text-muted-foreground mt-1">Units in stock</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-emerald-800" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-800">{analytics?.summary?.lowStockCount || stats.lowStock}</div>
            <p className="text-xs text-muted-foreground mt-1">Below reorder level</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-emerald-100 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{analytics?.summary?.outOfStockCount || stats.outOfStock}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate action</p>
          </CardContent>
        </Card>
      </div>

      {/* Movement Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl bg-green-50 dark:bg-green-950/20 border-green-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-400">Stock Received</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{analytics?.summary?.totalReceipts || 0}</p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-red-50 dark:bg-red-950/20 border-red-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-400">Stock Issued</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{analytics?.summary?.totalIssues || 0}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-800 dark:text-emerald-300">Assignments</p>
                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{analytics?.summary?.totalAssignments || 0}</p>
              </div>
              <Users className="h-8 w-8 text-emerald-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-800 dark:text-emerald-300">Pending Requests</p>
                <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{analytics?.summary?.pendingRequisitions || 0}</p>
              </div>
              <Package className="h-8 w-8 text-emerald-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-[800px]">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="h-4 w-4" />
            By Location
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <Building className="h-4 w-4" />
            By Department
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

        {/* Overview Tab - Enhanced */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Stock by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Stock by Category</CardTitle>
                <CardDescription>Distribution of inventory items by category</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(analytics?.stockByCategory || {}).map(([category, quantity]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-sm capitalize">{category}</span>
                        </div>
                        <Badge variant="outline">{quantity} units</Badge>
                      </div>
                    ))}
                    {Object.keys(analytics?.stockByCategory || {}).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No category data available</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Issued Items */}
            <Card>
              <CardHeader>
                <CardTitle>Top Issued Items</CardTitle>
                <CardDescription>Most frequently issued items this {selectedPeriod}</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(analytics?.topIssuedItems || []).slice(0, 5).map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">{index + 1}.</span>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <Badge>{item.count} issued</Badge>
                      </div>
                    ))}
                    {(analytics?.topIssuedItems || []).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No issues recorded this {selectedPeriod}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Movement Trends Chart Placeholder */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Stock Movement Trends</CardTitle>
                <CardDescription>Issues vs Receipts over time</CardDescription>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Issues</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Receipts</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="h-[200px] flex items-end gap-1">
                  {(analytics?.movementTrends || []).slice(-14).map((day, index) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex gap-0.5">
                        <div 
                          className="flex-1 bg-red-500 rounded-t" 
                          style={{ height: `${Math.min((day.issues / 10) * 100, 150)}px` }}
                        />
                        <div 
                          className="flex-1 bg-green-500 rounded-t" 
                          style={{ height: `${Math.min((day.receipts / 10) * 100, 150)}px` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground rotate-45">
                        {new Date(day.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                  {(analytics?.movementTrends || []).length === 0 && (
                    <div className="w-full flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">No movement data for this period</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Location Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Distribution by Location</CardTitle>
              <CardDescription>Inventory levels across all regional locations</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(analytics?.stockByLocation || {}).map(([location, data]) => (
                    <Card key={location} className="border-2">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{location}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Items</p>
                            <p className="font-bold text-lg">{data.items}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quantity</p>
                            <p className="font-bold text-lg text-blue-600">{data.quantity}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {Object.keys(analytics?.stockByLocation || {}).length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-3 text-center py-8">No location data available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Department Tab */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Issues by Department</CardTitle>
              <CardDescription>Which departments are receiving the most stock items this {selectedPeriod}</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Items Issued</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(analytics?.issuesByDepartment || {})
                      .sort(([,a], [,b]) => b - a)
                      .map(([dept, count]) => {
                        const totalIssues = Object.values(analytics?.issuesByDepartment || {}).reduce((a, b) => a + b, 0)
                        const percentage = totalIssues > 0 ? ((count / totalIssues) * 100).toFixed(1) : 0
                        return (
                          <TableRow key={dept}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                {dept}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{count}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{percentage}%</Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    {Object.keys(analytics?.issuesByDepartment || {}).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          No department data available for this period
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
