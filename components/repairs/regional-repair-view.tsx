"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DataPagination } from "@/components/ui/data-pagination"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Building2, MapPin, Wrench, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Device {
  id: string
  type: string
  brand: string
  model: string
  serialNumber: string
  assetTag: string
  location: string
}

interface ServiceProvider {
  id: string
  name: string
}

interface RegionalRepairViewProps {
  regionId: string
  regionName: string
}

export function RegionalRepairView({ regionId, regionName }: RegionalRepairViewProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [viewType, setViewType] = useState<"regional" | "head_office" | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([])
  const [selectedDevice, setSelectedDevice] = useState("")
  const [issueDescription, setIssueDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [selectedProvider, setSelectedProvider] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [tablePages, setTablePages] = useState<Record<string, number>>({ regional: 1, head_office: 1, all: 1 })
  const pageSize = 10

  const { data, isLoading, error, mutate } = useSWR(
    `/api/repairs/regional-repairs?regionId=${regionId}&type=${viewType}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Load devices and service providers on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load devices for this region
        const devicesRes = await fetch(`/api/devices?location=${regionName}`)
        const devicesData = await devicesRes.json()
        if (devicesRes.ok) {
          const mappedDevices = (devicesData.devices || []).map((d: any) => ({
            id: d.id,
            type: d.device_type || "Unknown",
            brand: d.brand || "Unknown",
            model: d.model || "Unknown",
            serialNumber: d.serial_number || "",
            assetTag: d.asset_tag || d.serial_number || "",
            location: d.location || "",
          }))
          setDevices(mappedDevices)
        }

        // Load service providers
        const providers: ServiceProvider[] = [
          { id: "nathland-company", name: "NATHLAND COMPANY LIMITED" },
          { id: "intel-computers", name: "INTEL COMPUTERS" },
        ]
        setServiceProviders(providers)
      } catch (err) {
        console.error("[v0] Error loading devices/providers:", err)
      }
    }
    loadData()
  }, [])

  const repairs = data?.results || {}

  useEffect(() => {
    setTablePages({ regional: 1, head_office: 1, all: 1 })
  }, [searchTerm, viewType])

  const createRepairTask = async () => {
    if (!selectedDevice || !issueDescription || !selectedProvider) {
      toast({
        title: "❌ Missing Information",
        description: "Please fill in all required fields: device, issue description, and service provider",
        variant: "destructive",
      })
      return
    }

    const device = devices.find((d) => d.id === selectedDevice)
    if (!device) {
      toast({
        title: "❌ Device Not Found",
        description: "The selected device could not be found.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: device.id,
          device_name: `${device.assetTag || device.serialNumber} - ${device.type} (${device.brand} ${device.model})`,
          issue_description: issueDescription,
          priority,
          service_provider_id: selectedProvider,
          service_provider_name: serviceProviders.find((p) => p.id === selectedProvider)?.name,
          service_provider_assigned_by: user?.name || user?.email || "Unknown",
          service_provider_assigned_date: new Date().toISOString(),
          requested_by: user?.id,
          requested_by_name: user?.name,
          location: device.location,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "❌ Failed to Create Repair Task",
          description: result.error || "An error occurred",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "✓ Repair Task Created",
        description: "The repair request has been submitted successfully",
      })

      // Reset form and close dialog
      setSelectedDevice("")
      setIssueDescription("")
      setPriority("medium")
      setSelectedProvider("")
      setShowCreateDialog(false)

      // Refresh repairs list
      mutate()
    } catch (error) {
      console.error("[v0] Error creating repair task:", error)
      toast({
        title: "❌ Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-purple-100 text-purple-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "returned":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filterRepairs = (repairList: any[]) => {
    if (!searchTerm) return repairList
    const search = searchTerm.toLowerCase()
    return repairList.filter(
      (r) =>
        r.task_number?.toLowerCase().includes(search) ||
        r.devices?.device_name?.toLowerCase().includes(search) ||
        r.service_providers?.name?.toLowerCase().includes(search)
    )
  }

  const renderRepairsTable = (repairList: any[], title: string, source: string) => {
    const filtered = filterRepairs(repairList || [])
    const currentPage = tablePages[source] || 1
    const paginatedRepairs = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            {source === "head_office" ? (
              <Building2 className="h-4 w-4" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {title}
            <Badge variant="outline">{filtered.length}</Badge>
          </h3>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Wrench className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm ? "No repairs match your search" : "No devices under repair"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task Number</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Service Provider</TableHead>
                  <TableHead>Assigned Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRepairs.map((repair: any) => (
                  <TableRow key={repair.id}>
                    <TableCell className="font-medium">{repair.task_number}</TableCell>
                    <TableCell className="text-sm">
                      <div>{repair.device_info?.brand} {repair.device_info?.model}</div>
                      <div className="text-xs text-muted-foreground">
                        {repair.device_info?.serial_number}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {repair.issue_description}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(repair.priority)}>
                        {repair.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(repair.status)}>
                        {repair.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {repair.service_providers?.name || "Unassigned"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(repair.assigned_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filtered.length > 0 && (
          <DataPagination
            currentPage={currentPage}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={(page) => setTablePages((prev) => ({ ...prev, [source]: page }))}
            itemLabel="repairs"
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Devices Under Repair - {regionName}</h2>
          <p className="text-muted-foreground">
            Track all devices from your region that are currently under repair
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Repair Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Repair Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="device">Device *</Label>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger id="device">
                    <SelectValue placeholder="Select a device" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device) => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.assetTag || device.serialNumber} - {device.type} ({device.brand} {device.model})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="issue">Issue Description *</Label>
                <Textarea
                  id="issue"
                  placeholder="Describe the issue with the device"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="provider">Service Provider *</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select a service provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceProviders.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createRepairTask} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Task"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {!isLoading && repairs && (
        <div className="grid gap-4 md:grid-cols-3">
          {repairs.regional && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Regional Repairs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{repairs.regional.count || 0}</div>
                <p className="text-xs text-muted-foreground">Local region repairs</p>
              </CardContent>
            </Card>
          )}

          {repairs.headOffice && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Head Office Repairs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{repairs.headOffice.count || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Devices sent to head office
                </p>
              </CardContent>
            </Card>
          )}

          {repairs.all && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wrench className="h-4 w-4" />
                  Total Repairs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{repairs.all.count || 0}</div>
                <p className="text-xs text-muted-foreground">All repairs</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by task number, device, or service provider..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Tabs for Different Views */}
      <Tabs value={viewType} onValueChange={(v) => setViewType(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Repairs</TabsTrigger>
          <TabsTrigger value="regional">Regional Only</TabsTrigger>
          <TabsTrigger value="head_office">Head Office</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              Failed to load repairs. Please try again.
            </div>
          ) : repairs.all ? (
            renderRepairsTable(repairs.all.repairs, "All Devices Under Repair", "all")
          ) : null}
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              Failed to load repairs. Please try again.
            </div>
          ) : repairs.regional ? (
            renderRepairsTable(
              repairs.regional.repairs,
              "Regional Devices Under Repair",
              "regional"
            )
          ) : null}
        </TabsContent>

        <TabsContent value="head_office" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              Failed to load repairs. Please try again.
            </div>
          ) : repairs.headOffice ? (
            renderRepairsTable(
              repairs.headOffice.repairs,
              "Head Office Repairs",
              "head_office"
            )
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
