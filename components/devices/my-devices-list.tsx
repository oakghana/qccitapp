"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Monitor,
  Smartphone,
  Printer,
  HardDrive,
  Laptop,
  Server,
  Search,
  RefreshCw,
  Download,
  Calendar,
  MapPin,
  Tag,
  User,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"

interface Device {
  id: string
  device_type: string
  brand: string
  model: string
  serial_number: string
  asset_tag: string
  status: string
  location: string
  assigned_to: string
  purchase_date: string
  warranty_expiry: string
  created_at: string
  created_by: string
  notes: string
}

const deviceTypeIcons: Record<string, any> = {
  laptop: Laptop,
  desktop: Monitor,
  printer: Printer,
  mobile: Smartphone,
  server: Server,
  monitor: Monitor,
  other: Monitor,
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300",
  inactive: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300",
  under_repair: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300",
  retired: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300",
}

export function MyDevicesList() {
  const { user } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadMyDevices()
    }
  }, [user])

  const loadMyDevices = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Get devices entered by this user OR assigned to this user
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .or(`created_by.eq.${user.id},assigned_to.ilike.%${user.name}%,assigned_to.ilike.%${user.username}%`)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading my devices:", JSON.stringify(error))
        // Fallback: try just by location and creation (case-insensitive)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("devices")
          .select("*")
          .ilike("location", user.location || "")
          .order("created_at", { ascending: false })

        if (!fallbackError && fallbackData) {
          setDevices(fallbackData)
        }
        return
      }

      setDevices(data || [])
    } catch (error) {
      console.error("[v0] Error loading my devices:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDevices = devices.filter((device) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      (device.brand?.toLowerCase() || "").includes(searchLower) ||
      (device.model?.toLowerCase() || "").includes(searchLower) ||
      (device.serial_number?.toLowerCase() || "").includes(searchLower) ||
      (device.asset_tag?.toLowerCase() || "").includes(searchLower) ||
      (device.assigned_to?.toLowerCase() || "").includes(searchLower)

    const matchesStatus = statusFilter === "all" || device.status === statusFilter
    const matchesType = typeFilter === "all" || device.device_type?.toLowerCase() === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getDeviceIcon = (type: string) => {
    const IconComponent = deviceTypeIcons[type?.toLowerCase()] || Monitor
    return <IconComponent className="h-5 w-5" />
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch {
      return "N/A"
    }
  }

  const getStats = () => {
    return {
      total: devices.length,
      active: devices.filter((d) => d.status === "active").length,
      underRepair: devices.filter((d) => d.status === "under_repair").length,
      retired: devices.filter((d) => d.status === "retired").length,
    }
  }

  const stats = getStats()

  const exportToCSV = () => {
    const headers = [
      "Device Type",
      "Brand",
      "Model",
      "Serial Number",
      "Asset Tag",
      "Status",
      "Location",
      "Assigned To",
      "Purchase Date",
      "Created At",
    ]

    const rows = filteredDevices.map((device) => [
      device.device_type || "",
      device.brand || "",
      device.model || "",
      device.serial_number || "",
      device.asset_tag || "",
      device.status || "",
      device.location || "",
      device.assigned_to || "",
      device.purchase_date || "",
      device.created_at || "",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `my-devices-${format(new Date(), "yyyy-MM-dd")}.csv`
    link.click()
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please log in to view your devices.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
            <Monitor className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Devices</h1>
            <p className="text-muted-foreground">
              View all devices you have entered or are assigned to you
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadMyDevices} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Repair</CardTitle>
            <div className="h-3 w-3 rounded-full bg-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.underRepair}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retired</CardTitle>
            <div className="h-3 w-3 rounded-full bg-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.retired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by brand, model, serial number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="under_repair">Under Repair</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Device Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="laptop">Laptop</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="printer">Printer</SelectItem>
                <SelectItem value="monitor">Monitor</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="server">Server</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Device List</CardTitle>
          <CardDescription>
            Showing {filteredDevices.length} of {devices.length} devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No devices found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "You haven't entered or been assigned any devices yet"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Serial / Asset Tag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            {getDeviceIcon(device.device_type)}
                          </div>
                          <div>
                            <p className="font-medium">
                              {device.brand} {device.model}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {device.device_type?.replace(/_/g, " ")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Tag className="h-3 w-3" />
                            {device.serial_number || "N/A"}
                          </div>
                          {device.asset_tag && (
                            <p className="text-xs text-muted-foreground">{device.asset_tag}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[device.status] || statusColors.active}>
                          {device.status?.replace(/_/g, " ") || "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{device.location?.replace(/_/g, " ") || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{device.assigned_to || "Unassigned"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{formatDate(device.purchase_date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(device.created_at)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
