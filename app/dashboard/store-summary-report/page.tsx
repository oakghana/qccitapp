"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar, FileText } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { FormNavigation } from "@/components/ui/form-navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StockBalanceItem {
  code: string
  itemName: string
  unitOfMeasure: string
  openingBalance: number
  receipts: number
  issues: number
  closingBalance: number
  location: string
  remarks: string
}

export default function StoreSummaryReportPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<StockBalanceItem[]>([])
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1) // First day of current month
    return date.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0]
  })
  const [locations, setLocations] = useState<string[]>([])

  useEffect(() => {
    async function fetchLocations() {
      try {
        const response = await fetch("/api/admin/lookup-data?type=locations")
        const data = await response.json()
        if (data.locations) {
          setLocations(data.locations.map((loc: any) => loc.name))
        }
      } catch (error) {
        console.error("[v0] Error loading locations:", error)
      }
    }
    fetchLocations()
  }, [])

  useEffect(() => {
    loadReport()
  }, [selectedLocation, startDate, endDate])

  async function loadReport() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        location: selectedLocation,
        startDate,
        endDate,
      })
      const response = await fetch(`/api/store/stock-balance-report?${params}`)

      if (!response.ok) {
        console.error("[v0] Error loading stock balance report")
        return
      }

      const { report: data } = await response.json()
      setReport(data || [])
    } catch (error) {
      console.error("[v0] Error loading stock balance report:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const locationName = selectedLocation === "all" ? "ALL LOCATIONS" : selectedLocation.toUpperCase()
    const periodEnd = new Date(endDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    const title = `${locationName}\nSTOCK BALANCE AS AT ${periodEnd.toUpperCase()}\nIT ACCESSORIES`

    const headers = [
      "S/N",
      "CODE",
      "STOCK ITEM",
      "UNIT OF MEAS.",
      "OPENING BALANCE",
      "RECEIPT",
      "ISSUES",
      "CLOSING BALANCE",
      "REMARKS",
    ]

    const rows = report.map((item, index) => [
      (index + 1).toString(),
      item.code,
      item.itemName,
      item.unitOfMeasure,
      item.openingBalance.toString(),
      item.receipts.toString(),
      item.issues.toString(),
      item.closingBalance.toString(),
      item.remarks || "",
    ])

    const csv = [title.split("\n"), [], headers, ...rows].map((row) => row.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `stock-balance-${selectedLocation}-${endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const printReport = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <FormNavigation currentPage="/dashboard/store-summary-report" />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Stock Balance Report</h2>
          <p className="text-muted-foreground">Stock movement tracking with opening and closing balances</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={printReport} variant="outline" className="gap-2 bg-transparent">
            <FileText className="h-4 w-4" />
            Print Report
          </Button>
          <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Period & Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">From Date</Label>
              <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">To Date</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>Loading stock balance report...</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="print:shadow-none">
          <CardHeader className="print:text-center">
            <CardTitle className="print:text-2xl">
              {selectedLocation === "all" ? "ALL LOCATIONS" : selectedLocation.toUpperCase()}
            </CardTitle>
            <CardDescription className="print:text-lg print:text-black">
              STOCK BALANCE AS AT{" "}
              {new Date(endDate)
                .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                .toUpperCase()}
              <br />
              IT ACCESSORIES
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left font-semibold">S/N</th>
                    <th className="border border-gray-300 p-2 text-left font-semibold">CODE</th>
                    <th className="border border-gray-300 p-2 text-left font-semibold">STOCK ITEM</th>
                    <th className="border border-gray-300 p-2 text-left font-semibold">UNIT OF MEAS.</th>
                    <th className="border border-gray-300 p-2 text-right font-semibold">OPENING BALANCE</th>
                    <th className="border border-gray-300 p-2 text-right font-semibold">RECEIPT</th>
                    <th className="border border-gray-300 p-2 text-right font-semibold">ISSUES</th>
                    <th className="border border-gray-300 p-2 text-right font-semibold">CLOSING BALANCE</th>
                    <th className="border border-gray-300 p-2 text-left font-semibold">REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {report.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="border border-gray-300 p-4 text-center text-muted-foreground">
                        No stock data available for the selected period
                      </td>
                    </tr>
                  ) : (
                    report.map((item, index) => (
                      <tr key={item.code} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2">{index + 1}</td>
                        <td className="border border-gray-300 p-2 font-medium">{item.code}</td>
                        <td className="border border-gray-300 p-2">{item.itemName}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.unitOfMeasure}</td>
                        <td className="border border-gray-300 p-2 text-right">{item.openingBalance}</td>
                        <td className="border border-gray-300 p-2 text-right">{item.receipts}</td>
                        <td className="border border-gray-300 p-2 text-right">{item.issues}</td>
                        <td className="border border-gray-300 p-2 text-right font-semibold">{item.closingBalance}</td>
                        <td className="border border-gray-300 p-2 text-sm">{item.remarks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:shadow-none,
          .print\\:shadow-none * {
            visibility: visible;
          }
          .print\\:shadow-none {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
