"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, AlertTriangle, Download, MapPin } from "lucide-react"
import { LOCATIONS } from "@/lib/locations"
import { downloadCSV } from "@/lib/export-utils"
import StockCardDetailModal from "./stock-card-detail-modal"
import { createBrowserClient } from "@/lib/supabase/client"

interface StockItem {
  id: string
  name: string
  category: string
  quantity: number
  reorder_level: number
  unit: string
  location: string
  sku: string
  siv_number: string
  supplier: string
}

interface LocationSummary {
  location: string
  totalItems: number
  totalValue: number
  lowStock: number
  outOfStock: number
}

export default function StoreHeadDashboard() {
  const [items, setItems] = useState<StockItem[]>([])
  const [locationSummaries, setLocationSummaries] = useState<LocationSummary[]>([])
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [loading, setLoading] = useState(true)

  const locationValues = Object.values(LOCATIONS)

  useEffect(() => {
    fetchAllInventory()
  }, [])

  const fetchAllInventory = async () => {
    try {
      const supabase = createBrowserClient()

      const { data, error } = await supabase.from("store_items").select("*").order("location").order("name")

      if (error) {
        console.error("[v0] Error fetching inventory:", error)
        setItems([])
        setLocationSummaries([])
        setLoading(false)
        return
      }

      console.log("[v0] Fetched store items from database:", data)

      if (data && data.length > 0) {
        setItems(data as StockItem[])
        calculateLocationSummaries(data as StockItem[])
      } else {
        // No data in database - show empty state
        console.log("[v0] No store items found in database")
        setItems([])
        setLocationSummaries([])
      }
    } catch (err) {
      console.error("[v0] Exception fetching inventory:", err)
      setItems([])
      setLocationSummaries([])
    } finally {
      setLoading(false)
    }
  }

  const calculateLocationSummaries = (stockItems: StockItem[]) => {
    const summaries = locationValues.map((location) => {
      const locationItems = stockItems.filter((item) => item.location === location)

      const totalItems = locationItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
      const totalValue = locationItems.reduce((sum, item) => {
        // Assuming unit_price exists or default to 0
        const unitPrice = (item as any).unit_price || 0
        return sum + (item.quantity || 0) * unitPrice
      }, 0)
      const lowStock = locationItems.filter((item) => item.quantity <= item.reorder_level && item.quantity > 0).length
      const outOfStock = locationItems.filter((item) => item.quantity === 0).length

      return {
        location,
        totalItems,
        totalValue,
        lowStock,
        outOfStock,
      }
    })

    setLocationSummaries(summaries)
  }

  const exportAllStock = () => {
    const data = {
      title: "All Locations Stock Summary",
      fileName: "all-locations-stock",
      headers: ["Location", "Item Name", "Category", "SKU", "Quantity", "Reorder Level", "Unit", "Supplier"],
      rows: items.map((item) => [
        item.location,
        item.name,
        item.category,
        item.sku,
        item.quantity,
        item.reorder_level,
        item.unit,
        item.supplier || "-",
      ]),
    }
    downloadCSV(data)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading inventory data...</div>
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Package className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">No store items found in the database</p>
        <p className="text-sm text-muted-foreground">Add items to the store inventory to see them here</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Store Inventory - All Locations</h2>
        <Button onClick={exportAllStock}>
          <Download className="mr-2 h-4 w-4" />
          Export All Stock
        </Button>
      </div>

      {/* Location Summaries */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {locationSummaries.map((summary) => (
          <Card key={summary.location}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {summary.location}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Items</span>
                  <span className="font-semibold">{summary.totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Value</span>
                  <span className="font-semibold">GH₵{summary.totalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Low Stock</span>
                  <Badge variant={summary.lowStock > 0 ? "destructive" : "secondary"}>{summary.lowStock}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Out of Stock</span>
                  <Badge variant={summary.outOfStock > 0 ? "destructive" : "secondary"}>{summary.outOfStock}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Items by Location */}
      {locationValues.map((location) => {
        const locationItems = items.filter((item) => item.location === location)
        if (locationItems.length === 0) return null

        return (
          <div key={location}>
            <h3 className="text-lg font-semibold mb-3">{location}</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {locationItems.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedItem(item)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <Package className="h-8 w-8 text-primary" />
                      {item.quantity <= item.reorder_level && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                    </div>
                    <h4 className="font-semibold mb-1">{item.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{item.category}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{item.quantity}</span>
                      <span className="text-sm text-muted-foreground">{item.unit}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">Reorder at: {item.reorder_level}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}

      {/* Detail Modal */}
      {selectedItem && (
        <StockCardDetailModal
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          item={{
            id: selectedItem.id,
            item_name: selectedItem.name,
            category: selectedItem.category,
            quantity_in_stock: selectedItem.quantity,
            reorder_level: selectedItem.reorder_level,
            unit_price: (selectedItem as any).unit_price || 0,
            location: selectedItem.location,
          }}
        />
      )}
    </div>
  )
}
