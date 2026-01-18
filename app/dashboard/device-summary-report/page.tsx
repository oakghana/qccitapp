"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Download, Package, MapPin, TrendingUp, Monitor, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface DeviceSummaryData {
  overall: {
    totalDevices: number
    totalAssigned: number
    totalAvailable: number
    totalInRepair: number
    totalRetired: number
    uniqueLocations: number
    uniqueDeviceTypes: number
  }
  byLocation: Record<
    string,
    {
      total: number
      assigned: number
      available: number
      inRepair: number
      retired: number
      byType: Record<string, number>
    }
  >
  byDeviceType: Record<
    string,
    {
      total: number
      assigned: number
      available: number
      inRepair: number
      retired: number
      locations: Record<string, number>
    }
  >
  userRole: string
  userLocation: string
  canSeeAllLocations: boolean
}

export default function DeviceSummaryReportPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DeviceSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [locationDevices, setLocationDevices] = useState<any[]>([])
  const [loadingDevices, setLoadingDevices] = useState(false)

  // Allowed roles for this page
  const allowedRoles = ["admin", "it_head"]

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      router.push("/dashboard")
    }
  }, [user, router])

  useEffect(() => {
    if (user && allowedRoles.includes(user.role)) {
      fetchSummaryData()
    }
  }, [user])

  const fetchSummaryData = async () => {
    try {
      setLoading(true)
      console.log("[v0] Fetching device summary report...")

      const userStr = localStorage.getItem("qcc_current_user")
      if (!userStr) {
        throw new Error("User not logged in")
      }
      const user = JSON.parse(userStr)

      const response = await fetch(`/api/devices/summary-report?username=${encodeURIComponent(user.username)}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] API error response:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch device summary`)
      }

      const result = await response.json()
      console.log("[v0] Device summary loaded successfully:", result)
      setData(result)
    } catch (err: any) {
      console.error("[v0] Error loading device summary:", err)
      setError(err.message || "Failed to load device summary")
    } finally {
      setLoading(false)
    }
  }

  const fetchLocationDevices = async (location: string) => {
    try {
      setLoadingDevices(true)
      setSelectedLocation(location)

      const userStr = localStorage.getItem("qcc_current_user")
      if (!userStr) return
      const user = JSON.parse(userStr)

      const response = await fetch(
        `/api/devices/by-location?location=${encodeURIComponent(location)}&username=${encodeURIComponent(user.username)}`,
      )

      if (!response.ok) {
        console.error("[v0] Failed to fetch location devices:", response.status)
        setLocationDevices([])
        return
      }

      const devices = await response.json()
      setLocationDevices(Array.isArray(devices) ? devices : [])
    } catch (err) {
      console.error("[v0] Error loading location devices:", err)
      setLocationDevices([])
    } finally {
      setLoadingDevices(false)
    }
  }

  const exportReport = () => {
    if (!data) return

    const csv = [
      ["Device Summary Report", ""],
      ["Generated at", new Date().toLocaleString()],
      [""],
      ["Overall Summary", ""],
      ["Total Devices", data.overall.totalDevices],
      ["Assigned", data.overall.totalAssigned],
      ["Available", data.overall.totalAvailable],
      ["In Repair", data.overall.totalInRepair],
      ["Retired", data.overall.totalRetired],
      ["Locations", data.overall.uniqueLocations],
      ["Device Types", data.overall.uniqueDeviceTypes],
      [""],
      ["By Location", ""],
      ["Location", "Total", "Assigned", "Available", "In Repair", "Retired"],
      ...Object.entries(data.byLocation).map(([location, stats]) => [
        location,
        stats.total,
        stats.assigned,
        stats.available,
        stats.inRepair,
        stats.retired,
      ]),
      [""],
      ["By Device Type", ""],
      ["Device Type", "Total", "Assigned", "Available", "In Repair", "Retired"],
      ...Object.entries(data.byDeviceType).map(([type, stats]) => [
        type,
        stats.total,
        stats.assigned,
        stats.available,
        stats.inRepair,
        stats.retired,
      ]),
    ]

    const csvContent = csv.map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `device-summary-report-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">You do not have access to this page.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Device Summary Report</h1>
          <p className="text-muted-foreground">Comprehensive device statistics and distribution analysis</p>
        </div>
        <Button onClick={exportReport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-3 gap-2 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-location">By Location</TabsTrigger>
          <TabsTrigger value="by-device">By Device Type</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overall.totalDevices}</div>
                <p className="text-xs text-muted-foreground">
                  {data.overall.uniqueDeviceTypes} types • {data.overall.uniqueLocations} locations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overall.totalAssigned}</div>
                <p className="text-xs text-muted-foreground">
                  {data.overall.totalDevices > 0
                    ? Math.round((data.overall.totalAssigned / data.overall.totalDevices) * 100)
                    : 0}
                  % utilization
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Monitor className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overall.totalAvailable}</div>
                <p className="text-xs text-muted-foreground">Ready for assignment</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Repair</CardTitle>
                <MapPin className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overall.totalInRepair}</div>
                <p className="text-xs text-muted-foreground">{data.overall.totalRetired} retired</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="by-location">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Devices by Location
              </CardTitle>
              <CardDescription>Distribution of devices across all locations (Click to view details)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.byLocation).map(([location, stats]) => (
                  <div
                    key={location}
                    className="border rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-primary transition-all"
                    onClick={() => fetchLocationDevices(location)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{location}</h3>
                      <Badge variant="secondary">{stats.total} devices</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Assigned</p>
                        <p className="font-semibold text-green-600">{stats.assigned}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Available</p>
                        <p className="font-semibold text-blue-600">{stats.available}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">In Repair</p>
                        <p className="font-semibold text-orange-600">{stats.inRepair}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Retired</p>
                        <p className="font-semibold text-gray-600">{stats.retired}</p>
                      </div>
                    </div>

                    {Object.keys(stats.byType).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">By Device Type:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(stats.byType).map(([type, count]) => (
                            <Badge key={type} variant="outline">
                              {type}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-device">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Devices by Type
              </CardTitle>
              <CardDescription>Breakdown of all device types and their distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.byDeviceType).map(([type, stats]) => (
                  <div key={type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{type}</h3>
                      <Badge variant="secondary">{stats.total} devices</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Assigned</p>
                        <p className="font-semibold text-green-600">{stats.assigned}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Available</p>
                        <p className="font-semibold text-blue-600">{stats.available}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">In Repair</p>
                        <p className="font-semibold text-orange-600">{stats.inRepair}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Retired</p>
                        <p className="font-semibold text-gray-600">{stats.retired}</p>
                      </div>
                    </div>

                    {Object.keys(stats.locations).length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-2">By Location:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(stats.locations).map(([location, count]) => (
                            <Badge key={location} variant="outline">
                              {location}: {count}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detailed Device Table Modal */}
      {selectedLocation && (
        <Dialog open={!!selectedLocation} onOpenChange={() => setSelectedLocation(null)}>
          <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Devices at {selectedLocation}</DialogTitle>
              <DialogDescription>Complete list of all devices at this location</DialogDescription>
            </DialogHeader>

            {loadingDevices ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-semibold">Device</th>
                      <th className="text-left p-3 font-semibold">Type</th>
                      <th className="text-left p-3 font-semibold">Serial Number</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                      <th className="text-left p-3 font-semibold">Assigned To</th>
                      <th className="text-left p-3 font-semibold">Model</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationDevices.map((device, idx) => (
                      <tr key={device.id} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-medium">
                          {device.brand} {device.model}
                        </td>
                        <td className="p-3 capitalize">{device.device_type}</td>
                        <td className="p-3 font-mono text-sm">{device.serial_number}</td>
                        <td className="p-3">
                          <Badge
                            variant={
                              device.status === "active"
                                ? "default"
                                : device.status === "repair"
                                  ? "destructive"
                                  : device.status === "maintenance"
                                    ? "secondary"
                                    : "outline"
                            }
                          >
                            {device.status}
                          </Badge>
                        </td>
                        <td className="p-3">{device.assigned_to || "Unassigned"}</td>
                        <td className="p-3 text-sm">
                          {device.brand} {device.model}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {locationDevices.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">No devices found at this location</div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
