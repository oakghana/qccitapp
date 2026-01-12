"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AddDeviceForm } from "./add-device-form"
import { DeviceTransferForm } from "./device-transfer-form"
import {
  Search,
  Plus,
  Monitor,
  Smartphone,
  Printer,
  HardDrive,
  ArrowRightLeft,
  MoreHorizontal,
  Edit,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { canSeeAllLocations } from "@/lib/location-filter"

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

const locationNames = {
  head_office: "Head Office",
  accra: "Accra",
  kumasi: "Kumasi",
  tamale: "Tamale",
  cape_coast: "Cape Coast",
  takoradi_port: "Takoradi Port",
  tema: "Tema",
  sunyani: "Sunyani",
  kaase_inland_port: "Kaase Inland Port",
  central_stores: "Central Stores",
}

export function DeviceInventory() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [addDeviceOpen, setAddDeviceOpen] = useState(false)
  const [transferDeviceOpen, setTransferDeviceOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [editDeviceOpen, setEditDeviceOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [editFormData, setEditFormData] = useState({
    device_type: "",
    brand: "",
    model: "",
    serial_number: "",
    status: "",
    location: "",
    assigned_to: "",
    purchase_date: "",
    warranty_expiry: "",
  })
  const [editError, setEditError] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    loadDevices()
  }, [])

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
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || device.status === statusFilter
    const matchesLocation = locationFilter === "all" || device.location === locationFilter

    return matchesSearch && matchesStatus && matchesLocation
  })

  const handleAddDevice = () => {
    // Just reload devices after form saves to database
    loadDevices()
    setAddDeviceOpen(false)
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
    setEditingDevice(device)
    setEditFormData({
      device_type: device.type,
      brand: device.brand,
      model: device.model,
      serial_number: device.serialNumber,
      status: device.status,
      location: device.location,
      assigned_to: device.assignedTo,
      purchase_date: device.assignedDate?.split("T")[0] || "",
      warranty_expiry: "",
    })
    setEditDeviceOpen(true)
  }

  const handleSaveDeviceEdit = async () => {
    if (!editingDevice || !user) return

    setEditError("")
    setEditLoading(true)

    try {
      const response = await fetch("/api/devices/update-device", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: editingDevice.id,
          updates: editFormData,
          updatedBy: user.full_name || user.email,
          reason: "Device details updated",
          userRole: user.role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setEditError(result.error || "Failed to update device")
        return
      }

      console.log("[v0] Device updated successfully")
      setEditDeviceOpen(false)
      setEditingDevice(null)
      await loadDevices()
    } catch (error) {
      console.error("[v0] Error updating device:", error)
      setEditError("Failed to update device")
    } finally {
      setEditLoading(false)
    }
  }

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
        <Dialog open={addDeviceOpen} onOpenChange={setAddDeviceOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Device</DialogTitle>
              <DialogDescription>Register a new IT device in the inventory system</DialogDescription>
            </DialogHeader>
            <AddDeviceForm onSubmit={handleAddDevice} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices, serial numbers, or assignees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
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
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="head_office">Head Office</SelectItem>
                <SelectItem value="accra">Accra</SelectItem>
                <SelectItem value="kumasi">Kumasi</SelectItem>
                <SelectItem value="tamale">Tamale</SelectItem>
                <SelectItem value="cape_coast">Cape Coast</SelectItem>
                <SelectItem value="takoradi_port">Takoradi Port</SelectItem>
                <SelectItem value="tema">Tema</SelectItem>
                <SelectItem value="sunyani">Sunyani</SelectItem>
                <SelectItem value="kaase_inland_port">Kaase Inland Port</SelectItem>
                <SelectItem value="central_stores">Central Stores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditDevice(device)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Device
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedDevice(device)
                          setTransferDeviceOpen(true)
                        }}
                      >
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Transfer Device
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
