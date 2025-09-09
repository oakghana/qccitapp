"use client"

import { useState } from "react"
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
import { Search, Plus, Monitor, Smartphone, Printer, HardDrive, ArrowRightLeft, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Device {
  id: string
  name: string
  type: "laptop" | "desktop" | "printer" | "mobile" | "server" | "other"
  serialNumber: string
  model: string
  brand: string
  status: "active" | "repair" | "maintenance" | "retired"
  location: "head_office" | "accra" | "kumasi" | "tamale" | "cape_coast"
  assignedTo: string
  assignedDate: string
  lastUpdated: string
}

const mockDevices: Device[] = [
  {
    id: "DL-2024-001",
    name: "Dell Latitude 5520",
    type: "laptop",
    serialNumber: "DL5520001",
    model: "Latitude 5520",
    brand: "Dell",
    status: "active",
    location: "accra",
    assignedTo: "Kwame Asante",
    assignedDate: "2024-01-15",
    lastUpdated: "2024-01-15",
  },
  {
    id: "HP-2024-045",
    name: "HP LaserJet Pro",
    type: "printer",
    serialNumber: "HP45LJ001",
    model: "LaserJet Pro M404n",
    brand: "HP",
    status: "repair",
    location: "head_office",
    assignedTo: "IT Department",
    assignedDate: "2024-02-01",
    lastUpdated: "2024-02-28",
  },
  {
    id: "LD-2024-012",
    name: "Lenovo ThinkCentre",
    type: "desktop",
    serialNumber: "TC2024012",
    model: "ThinkCentre M720q",
    brand: "Lenovo",
    status: "active",
    location: "kumasi",
    assignedTo: "Ama Osei",
    assignedDate: "2024-01-20",
    lastUpdated: "2024-01-20",
  },
  {
    id: "IP-2024-008",
    name: "iPhone 13",
    type: "mobile",
    serialNumber: "IP13008",
    model: "iPhone 13",
    brand: "Apple",
    status: "active",
    location: "tamale",
    assignedTo: "Kofi Mensah",
    assignedDate: "2024-02-10",
    lastUpdated: "2024-02-10",
  },
]

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
}

export function DeviceInventory() {
  const [devices, setDevices] = useState<Device[]>(mockDevices)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [addDeviceOpen, setAddDeviceOpen] = useState(false)
  const [transferDeviceOpen, setTransferDeviceOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || device.status === statusFilter
    const matchesLocation = locationFilter === "all" || device.location === locationFilter

    return matchesSearch && matchesStatus && matchesLocation
  })

  const handleAddDevice = (newDevice: Omit<Device, "id" | "lastUpdated">) => {
    const device: Device = {
      ...newDevice,
      id: `${newDevice.type.toUpperCase().slice(0, 2)}-2024-${String(devices.length + 1).padStart(3, "0")}`,
      lastUpdated: new Date().toISOString().split("T")[0],
    }
    setDevices([...devices, device])
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
    </div>
  )
}
