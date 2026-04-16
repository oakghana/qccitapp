"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wrench, AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { toast } from "@/hooks/use-toast"

interface DeviceForRepair {
  id: string
  device_id: string
  device_name: string
  device_type: string
  brand: string
  model: string
  serial_number: string
  asset_tag: string
  status: "pending_assignment" | "assigned" | "in_repair" | "completed" | "returned"
  issue_description: string
  priority: "low" | "medium" | "high" | "critical"
  service_provider_id: string | null
  service_provider_name: string | null
  location: string
  requested_by: string
  created_at: string
  updated_at: string
  estimated_completion: string | null
}

interface ServiceProvider {
  id: string
  name: string
  email: string
  phone: string
  specialization: string[]
}

export function HardwareServiceProviderDashboard() {
  const { user } = useAuth()
  const supabase = createClient()
  const [devices, setDevices] = useState<DeviceForRepair[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([])
  const [selectedProvider, setSelectedProvider] = useState("")
  const [assigningId, setAssigningId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadDevicesForRepair()
      loadServiceProviders()
    }
  }, [user])

  const loadDevicesForRepair = async () => {
    try {
      setLoading(true)
      setError(null)

      // Query repair_requests table which contains the actual repairs
      const { data: repairRequests, error: err } = await supabase
        .from("repair_requests")
        .select("*")
        .order("created_at", { ascending: false })

      if (err) throw err

      // Transform data to match interface
      const formattedDevices: DeviceForRepair[] = (repairRequests || []).map((repair: any) => ({
        id: repair.id,
        device_id: repair.device_id,
        device_name: repair.device_name || `Device ${repair.device_id?.slice(0, 8)}`,
        device_type: repair.device_type || "Unknown",
        brand: repair.brand || "Unknown",
        model: repair.model || "Unknown",
        serial_number: repair.serial_number || "",
        asset_tag: repair.asset_tag || "",
        status: repair.status || "pending",
        issue_description: repair.issue_description || repair.description || "No description provided",
        priority: repair.priority || "medium",
        service_provider_id: repair.service_provider_id,
        service_provider_name: repair.service_provider_name || null,
        location: repair.location || "Unknown",
        requested_by: repair.requested_by || "Unknown",
        created_at: repair.created_at || new Date().toISOString(),
        updated_at: repair.updated_at || new Date().toISOString(),
        estimated_completion: repair.estimated_completion || null,
      }))

      setDevices(formattedDevices)
    } catch (err: any) {
      console.error("[v0] Error loading devices for repair:", err)
      setError(err.message || "Failed to load devices")
      toast({
        title: "Error",
        description: "Failed to load devices marked for repair",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadServiceProviders = async () => {
    try {
      const { data, error: err } = await supabase
        .from("service_providers")
        .select("id, name, email, phone, specialization")
        .eq("is_active", true)

      if (err) throw err
      setServiceProviders(data || [])
    } catch (err: any) {
      console.error("[v0] Error loading service providers:", err)
    }
  }

  const assignToServiceProvider = async (deviceId: string, providerId: string) => {
    try {
      setAssigningId(deviceId)

      // Update repair request with service provider assignment
      const { error: err } = await supabase
        .from("repair_requests")
        .update({
          service_provider_id: providerId,
          status: "assigned",
          updated_at: new Date().toISOString(),
        })
        .eq("id", deviceId)

      if (err) throw err

      // Update local state
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId
            ? {
                ...d,
                status: "assigned" as const,
                service_provider_id: providerId,
                service_provider_name:
                  serviceProviders.find((p) => p.id === providerId)?.name || null,
              }
            : d,
        ),
      )

      toast({
        title: "Success",
        description: "Device assigned to service provider",
      })

      setSelectedProvider("")
    } catch (err: any) {
      console.error("[v0] Error assigning device:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to assign device",
        variant: "destructive",
      })
    } finally {
      setAssigningId(null)
    }
  }

  const filteredDevices = devices.filter((device) => {
    const matchesStatus = selectedStatus === "all" || device.status === selectedStatus
    const matchesSearch =
      searchTerm === "" ||
      device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.asset_tag.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: "Pending", variant: "outline", icon: AlertCircle },
      assigned: { label: "Assigned", variant: "secondary", icon: Wrench },
      in_progress: { label: "In Progress", variant: "default", icon: Wrench },
      completed: { label: "Completed", variant: "default", icon: CheckCircle },
      returned: { label: "Returned", variant: "outline", icon: CheckCircle },
      pending_assignment: { label: "Pending Assignment", variant: "outline", icon: AlertCircle },
      in_repair: { label: "In Repair", variant: "default", icon: Wrench },
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800 border-red-300",
      high: "bg-orange-100 text-orange-800 border-orange-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      low: "bg-blue-100 text-blue-800 border-blue-300",
    }
    return colors[priority] || colors.medium
  }

  const stats = {
    total: devices.length,
    pending: devices.filter((d) => d.status === "pending" || d.status === "pending_assignment").length,
    assigned: devices.filter((d) => d.status === "assigned").length,
    inRepair: devices.filter((d) => d.status === "in_repair" || d.status === "in_progress").length,
    completed: devices.filter((d) => d.status === "completed").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading devices...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Marked for repair</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Assignment</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Wrench className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">With service providers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Repair</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.inRepair}</div>
            <p className="text-xs text-muted-foreground">Currently being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Ready for pickup</p>
          </CardContent>
        </Card>
      </div>

      {/* Devices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Devices for Repair</CardTitle>
            <Button variant="outline" size="sm" onClick={loadDevicesForRepair}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by device name, serial number, or asset tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Devices List */}
          {filteredDevices.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No devices found</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredDevices.map((device) => (
                <div
                  key={device.id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {/* Device Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-sm truncate">{device.device_name}</h3>
                        <p className="text-xs text-muted-foreground">
                          SN: {device.serial_number || "N/A"} | Asset: {device.asset_tag || "N/A"}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(device.priority)}`}>
                        {device.priority.toUpperCase()}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{device.issue_description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-medium">{device.location}</span>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col gap-3 md:w-auto">
                    <div className="flex items-center justify-between md:block">
                      <span className="text-xs font-medium">Status:</span>
                      {getStatusBadge(device.status)}
                    </div>

                    {device.status === "pending" && (
                      <div className="flex gap-2">
                        <Select value={selectedProvider} onValueChange={(value) => setSelectedProvider(value)}>
                          <SelectTrigger className="w-40 h-8 text-xs">
                            <SelectValue placeholder="Select provider..." />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceProviders.map((provider) => (
                              <SelectItem key={provider.id} value={provider.id}>
                                {provider.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => assignToServiceProvider(device.id, selectedProvider)}
                          disabled={!selectedProvider || assigningId === device.id}
                          className="h-8"
                        >
                          {assigningId === device.id ? "Assigning..." : "Assign"}
                        </Button>
                      </div>
                    )}

                    {device.service_provider_name && (
                      <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                        Provider: {device.service_provider_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
