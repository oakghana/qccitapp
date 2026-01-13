"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar, FileText, Filter } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { FormNavigation } from "@/components/ui/form-navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StockBalanceItem {
  code: string
  itemName: string
  category: string
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
  const [selectedDeviceType, setSelectedDeviceType] = useState("all")
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1) // First day of current month
    return date.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0]
  })
  const [locations, setLocations] = useState<string[]>([])
  const [deviceTypes, setDeviceTypes] = useState<any[]>([])

  useEffect(() => {
    async function fetchFilters() {
      try {
        console.log("[v0] Fetching filter options...")

        // Fetch locations
        const locResponse = await fetch("/api/admin/lookup-data?type=locations")
        const locData = await locResponse.json()
        console.log("[v0] Locations response:", locData)

        // API returns array directly, not wrapped in object
        if (Array.isArray(locData)) {
          setLocations(locData.map((loc: any) => loc.name))
        }

        // Fetch device types
        const typeResponse = await fetch("/api/admin/lookup-data?type=device_types")
        const typeData = await typeResponse.json()
        console.log("[v0] Device types response:", typeData)

        // API returns array directly, not wrapped in object
        if (Array.isArray(typeData)) {
          setDeviceTypes(typeData)
        }
      } catch (error) {
        console.error("[v0] Error loading filter options:", error)
      }
    }
    fetchFilters()
  }, [])

  useEffect(() => {
    loadReport()
  }, [selectedLocation, selectedDeviceType, startDate, endDate])

  async function loadReport() {
    try {
      setLoading(true)
      console.log("[v0] Loading stock balance report with filters:", {
        location: selectedLocation,
        deviceType: selectedDeviceType,
        startDate,
        endDate,
      })

      const params = new URLSearchParams({
        location: selectedLocation,
        deviceType: selectedDeviceType,
        startDate,
        endDate,
      })

      // Get current user from localStorage for authentication
      const currentUser = localStorage.getItem("qcc_current_user")
      const username = currentUser ? JSON.parse(currentUser).username : ""

      const response = await fetch(`/api/store/stock-balance-report?${params}`, {
        headers: {
          "x-username": username,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error loading stock balance report:", errorData)
        return
      }

      const { report: data } = await response.json()
      console.log("[v0] Stock balance report loaded, items:", data?.length || 0)
      setReport(data || [])
    } catch (error) {
      console.error("[v0] Error loading stock balance report:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const locationName = selectedLocation === "all" ? "ALL LOCATIONS" : selectedLocation.toUpperCase()
    const deviceTypeName =
      selectedDeviceType === "all"
        ? "ALL ITEMS"
        : deviceTypes.find((dt) => dt.code === selectedDeviceType)?.name.toUpperCase() || ""
    const periodEnd = new Date(endDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    const title = `${locationName}\nSTOCK BALANCE AS AT ${periodEnd.toUpperCase()}\n${deviceTypeName}`

    const headers = [
      "S/N",
      "CODE",
      "STOCK ITEM",
      "CATEGORY",
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
      item.category || "IT Accessories",
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
    a.download = `stock-balance-${selectedLocation}-${selectedDeviceType}-${endDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportToPDF = () => {
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
          <Button onClick={exportToPDF} variant="outline" className="gap-2 bg-red-50 hover:bg-red-100 border-red-200">
            <FileText className="h-4 w-4 text-red-600" />
            <span className="text-red-600">Export PDF</span>
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
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="device-type">Device Type / Category</Label>
              <Select value={selectedDeviceType} onValueChange={setSelectedDeviceType}>
                <SelectTrigger id="device-type">
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type.code} value={type.code}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date()
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
                setStartDate(firstDay.toISOString().split("T")[0])
                setEndDate(now.toISOString().split("T")[0])
              }}
            >
              <Calendar className="h-3 w-3 mr-1" />
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date()
                const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
                setStartDate(firstDay.toISOString().split("T")[0])
                setEndDate(lastDay.toISOString().split("T")[0])
              }}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Last Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date()
                const firstDay = new Date(now.getFullYear(), 0, 1)
                setStartDate(firstDay.toISOString().split("T")[0])
                setEndDate(now.toISOString().split("T")[0])
              }}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Year to Date
            </Button>
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
              {selectedDeviceType === "all"
                ? "IT ACCESSORIES - ALL CATEGORIES"
                : deviceTypes.find((dt) => dt.code === selectedDeviceType)?.name.toUpperCase() || "IT ACCESSORIES"}
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
                    <th className="border border-gray-300 p-2 text-left font-semibold">CATEGORY</th>
                    <th className="border border-gray-300 p-2 text-left font-semibold">UNIT OF MEAS.</th>
                    <th className="border border-gray-300 p-2 text-right font-semibold">OPENING BALANCE</th>
                    <th className="border border-gray-300 p-2 text-right font-semibold">RECEIPT</th>
                    <th className="border border-gray-300 p-2 text-right font-semibold">ISSUES</th>
                    <th className="border border-gray-300 p-2 text-right font-semibold">CLOSING BALANCE</th>
                    <th className="border border-gray-300 p-2 text-left font-semibold print:hidden">REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {report.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="border border-gray-300 p-4 text-center text-muted-foreground">
                        No stock data available for the selected filters
                      </td>
                    </tr>
                  ) : (
                    report.map((item, index) => (
                      <tr key={item.code} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2">{index + 1}</td>
                        <td className="border border-gray-300 p-2 font-medium">{item.code}</td>
                        <td className="border border-gray-300 p-2">{item.itemName}</td>
                        <td className="border border-gray-300 p-2 text-sm">{item.category || "Accessories"}</td>
                        <td className="border border-gray-300 p-2 text-center">{item.unitOfMeasure}</td>
                        <td className="border border-gray-300 p-2 text-right">{item.openingBalance}</td>
                        <td className="border border-gray-300 p-2 text-right">{item.receipts}</td>
                        <td className="border border-gray-300 p-2 text-right">{item.issues}</td>
                        <td className="border border-gray-300 p-2 text-right font-semibold">{item.closingBalance}</td>
                        <td className="border border-gray-300 p-2 text-sm print:hidden">{item.remarks}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {report.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={5} className="border border-gray-300 p-2 text-right">
                        TOTALS:
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {report.reduce((sum, item) => sum + item.openingBalance, 0)}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {report.reduce((sum, item) => sum + item.receipts, 0)}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {report.reduce((sum, item) => sum + item.issues, 0)}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        {report.reduce((sum, item) => sum + item.closingBalance, 0)}
                      </td>
                      <td className="border border-gray-300 p-2 print:hidden"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
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
          .print\\:hidden {
            display: none !important;
          }
          .print\\:text-center {
            text-align: center;
          }
          .print\\:text-2xl {
            font-size: 1.5rem;
          }
          .print\\:text-lg {
            font-size: 1.125rem;
          }
          .print\\:text-black {
            color: black !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  )
}
