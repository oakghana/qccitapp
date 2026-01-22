"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Package, Printer, Download } from "lucide-react"
import { LOCATIONS } from "@/lib/locations"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export default function RegionalNeedsAnalysisPage() {
  const { user } = useAuth()
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [replacementNeeds, setReplacementNeeds] = useState<any[]>([])
  const [tonerNeeds, setTonerNeeds] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Check authorization - only admin, it_head, and regional_it_head can access
  const canAccessPage = ["admin", "it_head", "regional_it_head"].includes(user?.role || "")
  const isRegionalHead = user?.role === "regional_it_head"

  // Auto-set location for regional IT heads
  useEffect(() => {
    if (isRegionalHead && user?.location) {
      setSelectedLocation(user.location)
    }
  }, [isRegionalHead, user?.location])

  const fetchReplacementNeeds = async () => {
    if (!canAccessPage) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `/api/regional-needs-analysis?type=replacement&location=${selectedLocation}&user_role=${user?.role}&user_location=${user?.location || ""}`
      )
      const data = await response.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        setReplacementNeeds(data.recommendations || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching replacement needs:", error)
      toast.error("Failed to load replacement recommendations")
    } finally {
      setLoading(false)
    }
  }

  const fetchTonerNeeds = async () => {
    if (!canAccessPage) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `/api/regional-needs-analysis?type=toner&location=${selectedLocation}&user_role=${user?.role}&user_location=${user?.location || ""}`
      )
      const data = await response.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        setTonerNeeds(data.tonerNeeds || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching toner needs:", error)
      toast.error("Failed to load toner requirements")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReplacementNeeds()
    fetchTonerNeeds()
  }, [selectedLocation])

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error("No data to export")
      return
    }

    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((row) => Object.values(row).join(","))
    const csv = [headers, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getUrgencyBadge = (ageYears: number, repairCount: number) => {
    if (ageYears >= 5 || repairCount >= 3) {
      return <Badge className="bg-red-500">Critical</Badge>
    }
    if (ageYears >= 3 || repairCount >= 2) {
      return <Badge className="bg-orange-500">High Priority</Badge>
    }
    return <Badge className="bg-yellow-500">Monitor</Badge>
  }

  // Show unauthorized message if user cannot access
  if (!canAccessPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              You do not have permission to access the Regional IT Needs Analysis page. 
              This page is only available to Administrators, IT Heads, and Regional IT Heads.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Regional IT Needs Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isRegionalHead 
              ? `Automated procurement recommendations for ${LOCATIONS[user?.location as keyof typeof LOCATIONS] || user?.location}`
              : "Automated procurement recommendations based on device aging and usage patterns"}
          </p>
        </div>
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className="w-64">
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
      </div>

      <Tabs defaultValue="replacement" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="replacement">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Device Replacement
          </TabsTrigger>
          <TabsTrigger value="toner">
            <Printer className="h-4 w-4 mr-2" />
            Toner Requirements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="replacement" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Devices Requiring Replacement</CardTitle>
                  <CardDescription>
                    Devices older than 3 years or with frequent repairs
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportToCSV(replacementNeeds, `replacement-needs-${selectedLocation}-${new Date().toISOString().split("T")[0]}.csv`)
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : replacementNeeds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No devices require replacement at this time
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Age (Years)</TableHead>
                      <TableHead>Repair Count</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {replacementNeeds.map((device) => (
                      <TableRow key={device.device_id}>
                        <TableCell className="font-medium">
                          {device.brand} {device.model}
                          <div className="text-sm text-muted-foreground">{device.device_type}</div>
                        </TableCell>
                        <TableCell>{device.serial_number}</TableCell>
                        <TableCell>{LOCATIONS[device.location as keyof typeof LOCATIONS] || device.location}</TableCell>
                        <TableCell>{device.device_age_years?.toFixed(1)}</TableCell>
                        <TableCell>{device.repair_count || 0}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{device.device_condition || "Good"}</Badge>
                        </TableCell>
                        <TableCell>
                          {getUrgencyBadge(device.device_age_years, device.repair_count)}
                        </TableCell>
                        <TableCell className="text-sm">{device.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="toner" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Monthly Toner Requirements</CardTitle>
                  <CardDescription>
                    Estimated toner needs based on printer usage and capacity
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    exportToCSV(tonerNeeds, `toner-needs-${selectedLocation}-${new Date().toISOString().split("T")[0]}.csv`)
                  }
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : tonerNeeds.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No toner requirements data available
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Toner Type</TableHead>
                      <TableHead>Printer Count</TableHead>
                      <TableHead>Monthly Volume (pages)</TableHead>
                      <TableHead>Avg Yield (pages)</TableHead>
                      <TableHead>Toners/Month</TableHead>
                      <TableHead>Quarterly Need</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tonerNeeds.map((toner, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">
                          {LOCATIONS[toner.location as keyof typeof LOCATIONS] || toner.location}
                        </TableCell>
                        <TableCell>
                          {toner.toner_type}
                          {toner.toner_model && (
                            <div className="text-sm text-muted-foreground">{toner.toner_model}</div>
                          )}
                        </TableCell>
                        <TableCell>{toner.printer_count}</TableCell>
                        <TableCell>{toner.total_monthly_volume?.toLocaleString()}</TableCell>
                        <TableCell>{toner.avg_toner_yield?.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className="bg-blue-500">
                            {Math.ceil(toner.estimated_toners_needed_monthly)} toners
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">
                            {Math.ceil(toner.estimated_toners_needed_monthly * 3)} toners
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Aggregated toner requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Total Printers</div>
                  <div className="text-2xl font-bold">
                    {tonerNeeds.reduce((sum, t) => sum + (t.printer_count || 0), 0)}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Monthly Toner Need</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.ceil(tonerNeeds.reduce((sum, t) => sum + (t.estimated_toners_needed_monthly || 0), 0))}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Quarterly Toner Need</div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.ceil(tonerNeeds.reduce((sum, t) => sum + (t.estimated_toners_needed_monthly || 0), 0) * 3)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
