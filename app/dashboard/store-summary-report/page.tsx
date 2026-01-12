"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, TrendingDown, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { FormNavigation } from "@/components/ui/form-navigation"

interface SummaryItem {
  itemName: string
  category: string
  previousMonthBalance: number
  quantityIssuedThisMonth: number
  currentStock: number
  reorderLevel: number
  quantityRequired: number
  totalValue: number
  location: string
  status: "In Stock" | "Low Stock" | "Out of Stock"
}

export default function StoreSummaryReportPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<SummaryItem[]>([])

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true)
        const response = await fetch("/api/store/summary-report")

        if (!response.ok) {
          console.error("[v0] Error loading summary report")
          return
        }

        const { report: data } = await response.json()
        setReport(data)
      } catch (error) {
        console.error("[v0] Error loading summary report:", error)
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [])

  const exportToCSV = () => {
    const headers = [
      "Item Name",
      "Category",
      "Previous Month Balance",
      "Qty Issued This Month",
      "Current Stock",
      "Reorder Level",
      "Qty Required",
      "Total Value (GHC)",
      "Location",
      "Status",
    ]

    const rows = report.map((item) => [
      item.itemName,
      item.category,
      item.previousMonthBalance,
      item.quantityIssuedThisMonth,
      item.currentStock,
      item.reorderLevel,
      item.quantityRequired,
      item.totalValue.toFixed(2),
      item.location,
      item.status,
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `store-summary-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const totals = {
    totalValue: report.reduce((sum, item) => sum + item.totalValue, 0),
    totalRequired: report.reduce((sum, item) => sum + item.quantityRequired, 0),
    lowStock: report.filter((item) => item.status === "Low Stock").length,
    outOfStock: report.filter((item) => item.status === "Out of Stock").length,
  }

  return (
    <div className="space-y-6">
      <FormNavigation currentPage="/dashboard/store-summary-report" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Store Summary Report</h2>
          <p className="text-muted-foreground">Comprehensive inventory analysis and procurement planning</p>
        </div>

        <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">GHC {totals.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Items Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalRequired}</div>
            <p className="text-xs text-muted-foreground">Units needed for reorder</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-orange-600">{totals.lowStock}</div>
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-red-600">{totals.outOfStock}</div>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>Loading report data...</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Details</CardTitle>
            <CardDescription>Item-level analysis with procurement history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Item Name</th>
                    <th className="text-left p-3 font-semibold">Category</th>
                    <th className="text-right p-3 font-semibold">Previous Month</th>
                    <th className="text-right p-3 font-semibold">This Month</th>
                    <th className="text-right p-3 font-semibold">Current</th>
                    <th className="text-right p-3 font-semibold">Reorder</th>
                    <th className="text-right p-3 font-semibold">Required</th>
                    <th className="text-right p-3 font-semibold">Value</th>
                    <th className="text-left p-3 font-semibold">Location</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{item.itemName}</td>
                      <td className="p-3">{item.category}</td>
                      <td className="p-3 text-right">{item.previousMonthBalance}</td>
                      <td className="p-3 text-right">{item.quantityIssuedThisMonth}</td>
                      <td className="p-3 text-right font-semibold">{item.currentStock}</td>
                      <td className="p-3 text-right">{item.reorderLevel}</td>
                      <td className="p-3 text-right">
                        {item.quantityRequired > 0 ? (
                          <span className="text-red-600 font-semibold">{item.quantityRequired}</span>
                        ) : (
                          <span className="text-green-600">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right">GHC {item.totalValue.toLocaleString()}</td>
                      <td className="p-3">{item.location}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            item.status === "Out of Stock"
                              ? "destructive"
                              : item.status === "Low Stock"
                                ? "default"
                                : "secondary"
                          }
                          className={
                            item.status === "Low Stock"
                              ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                              : ""
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
