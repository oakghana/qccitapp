"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DeviceTransferForm } from "./device-transfer-form"
import { Plus, Monitor, Smartphone, Printer, HardDrive, MoreHorizontal } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { canSeeAllLocations } from "@/lib/location-filter"
import { toast } from "@/components/ui/use-toast"

interface Device {
  id: string
  name: string
  type: "laptop" | "desktop" | "printer" | "mobile" | "server" | "other"
  serialNumber: string
  model: string
  brand: string
  status: "active" | "repair" | "maintenance" | "retired"
  location:
    | "head_office"
    | "accra"
    | "kumasi"
    | "tamale"
    | "cape_coast"
    | "takoradi_port"
    | "tema"
    | "sunyani"
    | "kaase_inland_port"
    | "central_stores"
  assignedTo: string
  assignedDate: string
  lastUpdated: string
  deviceType: "laptop" | "desktop" | "printer" | "mobile" | "server" | "other"
  purchaseDate: string
  warrantyExpiry: string
}

const deviceTypeIcons = {
  laptop: Monitor,
  desktop: Monitor,
  printer: Printer,
  mobile: Smartphone,
  server: HardDrive,
  other: Monitor,
}

const statusColors = {
  active: "default",
  repair: "destructive",
  maintenance: "secondary",
  retired: "outline",
} as const

export function DeviceInventory() {
  const { user } = useAuth()
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [transferDeviceOpen, setTransferDeviceOpen] = useState(false)
  const [editDeviceOpen, setEditDeviceOpen] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState("")
  const [editFormData, setEditFormData] = useState({
    device_type: "",
    brand: "",
    model: "",
    serial_number: "",
    status: "",
    location: "", // Added location field
    assigned_to: "",
    purchase_date: "",
    warranty_expiry: "",
  })
  const [dbLocations, setDbLocations] = useState<{ code: string; name: string }[]>([])

  const supabase = createClient()

  useEffect(() => {
    loadDevices()
    loadLocations() // Load locations from database
  }, [])

  const loadLocations = async () => {
    try {
      const res = await fetch("/api/admin/lookup-data?type=locations")
      if (res.ok) {
        const data = await res.json()
        const activeLocations = data
          .filter((loc: any) => loc.is_active)
          .map((loc: any) => ({
            code: loc.code,
            name: loc.name,
          }))
        setDbLocations(activeLocations)
      }
    } catch (error) {
      console.error("Error loading locations:", error)
    }
  }

  const loadDevices = async () => {
    try {
      setLoading(true)
      let query = supabase.from("devices").select("*").order("created_at", { ascending: false })

      if (user && !canSeeAllLocations(user) && user.location) {
        query = query.eq("location", user.location)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error loading devices:", error)
        return
      }

      console.log("[v0] Loaded devices from Supabase:", data)

      const mappedDevices: Device[] = data.map((device: any) => ({
        id: device.id,
        name: `${device.brand} ${device.model}`,
        type: device.device_type?.toLowerCase() || "other",
        serialNumber: device.serial_number,
        model: device.model,
        brand: device.brand,
        status: device.status || "active",
        location: (device.location?.toLowerCase().replace(/ /g, "_") || "head_office") as Device["location"],
        assignedTo: device.assigned_to || "Unassigned",
        assignedDate: device.purchase_date || device.created_at,
        lastUpdated: device.updated_at || device.created_at,
        deviceType: device.device_type?.toLowerCase() || "other",
        purchaseDate: device.purchase_date || "",
        warrantyExpiry: device.warranty_expiry || "",
      }))

      console.log(
        "[v0] Mapped devices with locations:",
        mappedDevices.map((d) => ({ name: d.name, location: d.location })),
      )

      setDevices(mappedDevices)
    } catch (error) {
      console.error("[v0] Error loading devices:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || device.status === statusFilter
    const matchesLocation = locationFilter === "all" || device.location === locationFilter

    return matchesSearch && matchesStatus && matchesLocation
  })

  const handleAddDevice = () => {
    // Just reload devices after form saves to database
    loadDevices()
    setTransferDeviceOpen(false)
  }

  const handleTransferDevice = (deviceId: string, newLocation: string, newAssignee: string) => {
    setDevices(
      devices.map((device) =>
        device.id === deviceId
          ? {
              ...device,
              location: newLocation as Device["location"],
              assignedTo: newAssignee,
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : device,
      ),
    )
    setTransferDeviceOpen(false)
    setSelectedDevice(null)
  }

  const handleEditDevice = (device: Device) => {
    setSelectedDevice(device)
    setEditFormData({
      device_type: device.deviceType,
      brand: device.brand,
      model: device.model,
      serial_number: device.serialNumber,
      status: device.status,
      location: device.location, // Include location in form data
      assigned_to: device.assignedTo,
      purchase_date: device.purchaseDate || "",
      warranty_expiry: device.warrantyExpiry || "",
    })
    setEditDeviceOpen(true)
    setEditError("")
  }

  const handleSaveDeviceEdit = async () => {
    if (!selectedDevice) return

    try {
      setEditLoading(true)
      setEditError("")

      const response = await fetch("/api/devices/update-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedDevice.id,
          device_type: editFormData.device_type,
          brand: editFormData.brand,
          model: editFormData.model,
          serial_number: editFormData.serial_number,
          status: editFormData.status,
          location: editFormData.location, // Include location in update
          assigned_to: editFormData.assigned_to,
          purchase_date: editFormData.purchase_date,
          warranty_expiry: editFormData.warranty_expiry,
          userRole: user?.role,
          userLocation: user?.location,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update device")
      }

      toast({
        title: "Success",
        description: "Device updated successfully",
      })

      setEditDeviceOpen(false)
      loadDevices()
    } catch (error: any) {
      setEditError(error.message)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setEditLoading(false)
    }
  }

  const locationNames: Record<string, string> = {}
  dbLocations.forEach((loc) => {
    locationNames[loc.code] = loc.name
    locationNames[loc.code.toLowerCase()] = loc.name // Support lowercase codes
    locationNames[loc.code.toUpperCase()] = loc.name // Support uppercase codes
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading devices...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Device Inventory</h1>
          <p className="text-muted-foreground">Manage and track IT devices across all locations</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Device
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <Input
            placeholder="Search devices, serial numbers, or assignees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="repair">Under Repair</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {dbLocations.map((loc) => (
              <SelectItem key={loc.code} value={loc.code}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Device Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDevices.map((device) => {
          const IconComponent = deviceTypeIcons[device.type]
          return (
            <Card key={device.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{device.name}</CardTitle>
                      <CardDescription className="text-sm">{device.id}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={statusColors[device.status]}>
                    {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="text-sm font-medium">{locationNames[device.location]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Assigned To</span>
                  <span className="text-sm font-medium">{device.assignedTo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Model</span>
                  <span className="text-sm">
                    {device.brand} {device.model}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Serial</span>
                  <span className="text-sm font-mono">{device.serialNumber}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredDevices.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No devices found</h3>
            <p className="text-muted-foreground text-center">
              No devices match your current filters. Try adjusting your search criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Transfer Device Dialog */}
      <Dialog open={transferDeviceOpen} onOpenChange={setTransferDeviceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Device</DialogTitle>
            <DialogDescription>Move {selectedDevice?.name} to a different location or assignee</DialogDescription>
          </DialogHeader>
          {selectedDevice && (
            <DeviceTransferForm
              device={selectedDevice}
              onSubmit={handleTransferDevice}
              onCancel={() => {
                setTransferDeviceOpen(false)
                setSelectedDevice(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={editDeviceOpen} onOpenChange={setEditDeviceOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>Update device details and information</DialogDescription>
          </DialogHeader>
          {editError && <div className="bg-destructive/10 text-destructive px-4 py-2 rounded">{editError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Device Type</label>
              <Select
                value={editFormData.device_type}
                onValueChange={(value) => setEditFormData({ ...editFormData, device_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="printer">Printer</SelectItem>
                  <SelectItem value="mobile">Mobile Device</SelectItem>
                  <SelectItem value="server">Server</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand</label>
              <Input
                value={editFormData.brand}
                onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Input
                value={editFormData.model}
                onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Serial Number</label>
              <Input
                value={editFormData.serial_number}
                onChange={(e) => setEditFormData({ ...editFormData, serial_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="repair">Under Repair</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned To</label>
              <Input
                value={editFormData.assigned_to}
                onChange={(e) => setEditFormData({ ...editFormData, assigned_to: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Purchase Date</label>
              <Input
                type="date"
                value={editFormData.purchase_date}
                onChange={(e) => setEditFormData({ ...editFormData, purchase_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Warranty Expiry</label>
              <Input
                type="date"
                value={editFormData.warranty_expiry}
                onChange={(e) => setEditFormData({ ...editFormData, warranty_expiry: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select
                value={editFormData.location}
                onValueChange={(value) => setEditFormData({ ...editFormData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {dbLocations.map((loc) => (
                    <SelectItem key={loc.code} value={loc.code}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setEditDeviceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDeviceEdit} disabled={editLoading}>
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
