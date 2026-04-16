"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { AlertCircle, CheckCircle2, Clock, Loader2, Package, Wrench } from "lucide-react"
import { RepairDetailModal } from "./repair-detail-modal"
import { UpdateRepairStatusModal } from "./update-repair-status-modal"
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface RepairJob {
  id: string
  task_number: string
  device_id: string
  device_info?: {
    device_type: string
    brand: string
    model: string
    serial_number: string
    asset_tag?: string
  }
  device_name?: string
  issue_description: string
  priority: "low" | "medium" | "high" | "critical"
  status: "new" | "pending" | "assigned" | "in_progress" | "completed" | "returned"
  assigned_date?: string
  requested_date?: string
  estimated_cost: number | null
  actual_cost?: number | null
  work_started_at?: string | null
  work_completed_at?: string | null
  confirmed_at?: string | null
  notes?: string | null
  location?: string
  service_provider_id?: string
  service_provider_name?: string
  devices?: {
    device_name: string
    assigned_to: string
    asset_tag?: string
    profiles?: {
      full_name: string
      email: string
    }
  }
}

export function MyRepairJobs({ serviceProviderId }: { serviceProviderId: string }) {
  const [viewMode, setViewMode] = useState<"assigned" | "available">("assigned")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRepair, setSelectedRepair] = useState<RepairJob | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const { data, isLoading, error, mutate } = useSWR(
    viewMode === "assigned"
      ? `/api/repairs/service-provider/my-devices?serviceProviderId=${serviceProviderId}&status=${selectedStatus}`
      : `/api/repairs/service-provider/all-available?status=${selectedStatus}`,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true }
  )

  // Set up realtime listeners for repairs
  useRealtimeUpdates({
    table: "repair_requests",
    onUpdate: (data) => {
      console.log("[v0] Repair updated in realtime:", data)
      mutate()
    },
    onInsert: (data) => {
      console.log("[v0] New repair created in realtime:", data)
      mutate()
    },
  })

  const repairs: RepairJob[] = data?.repairs || []

  const handleSelfAssign = async (repair: RepairJob) => {
    setAssigningId(repair.id)
    setIsAssigning(true)

    try {
      const response = await fetch("/api/repairs/service-provider/self-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repairId: repair.id,
          serviceProviderId,
          serviceProviderName: "Service Provider", // TODO: Get from user context
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Error assigning repair:", result.error)
        // Show error toast
        return
      }

      console.log("[v0] Repair assigned successfully:", result)
      // Refresh both lists
      mutate()
    } catch (error) {
      console.error("[v0] Error in self-assign:", error)
    } finally {
      setIsAssigning(false)
      setAssigningId(null)
    }
  }

  const filteredRepairs = repairs.filter((repair) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const deviceInfo = repair.device_info || {}
      return (
        repair.task_number?.toLowerCase().includes(search) ||
        (repair.device_name || "").toLowerCase().includes(search) ||
        deviceInfo.brand?.toLowerCase().includes(search) ||
        deviceInfo.model?.toLowerCase().includes(search) ||
        deviceInfo.serial_number?.toLowerCase().includes(search) ||
        repair.issue_description?.toLowerCase().includes(search) ||
        repair.devices?.device_name?.toLowerCase().includes(search)
      )
    }
    return true
  })

  const stats = {
    assigned: repairs.filter((r) => r.status === "assigned").length,
    inProgress: repairs.filter((r) => r.status === "in_progress").length,
    completed: repairs.filter((r) => r.status === "completed").length,
    returned: repairs.filter((r) => r.status === "returned").length,
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "assigned":
        return <AlertCircle className="h-4 w-4" />
      case "in_progress":
        return <Wrench className="h-4 w-4" />
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />
      case "returned":
        return <Package className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">Awaiting work start</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Wrench className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Currently working on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Ready for pickup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returned</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.returned}</div>
            <p className="text-xs text-muted-foreground">Completed & returned</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {viewMode === "assigned" ? "My Repair Jobs" : "Available Repairs"}
              </CardTitle>
              <CardDescription>
                {viewMode === "assigned"
                  ? "Manage and track all devices assigned to you for repair"
                  : "Find and claim available repair tasks in your area"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => {
            setViewMode(v as "assigned" | "available")
            setSelectedStatus("all")
          }}>
            <TabsList>
              <TabsTrigger value="assigned">My Jobs ({stats.assigned + stats.inProgress})</TabsTrigger>
              <TabsTrigger value="available">Available Repairs</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters and Search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Input
              placeholder={viewMode === "assigned" 
                ? "Search by device name, brand, model, serial number..."
                : "Search by task #, device, or location..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:w-64"
            />
            <div className="flex gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {viewMode === "assigned" ? (
                    <>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repairs Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              Failed to load repair jobs. Please try again.
            </div>
          ) : filteredRepairs.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-2 text-muted-foreground">
                {searchTerm 
                  ? "No repairs match your search" 
                  : viewMode === "assigned"
                  ? "No repairs assigned yet"
                  : "No available repairs at this time"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Number</TableHead>
                    <TableHead>Device Info</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>{viewMode === "assigned" ? "Assigned Date" : "Created Date"}</TableHead>
                    <TableHead>Est. Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRepairs.map((repair) => (
                    <TableRow key={repair.id}>
                      <TableCell className="font-medium">{repair.task_number}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {repair.device_info?.brand} {repair.device_info?.model}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {repair.device_info?.serial_number}
                            {repair.device_info?.asset_tag && ` (Tag: ${repair.device_info.asset_tag})`}
                          </div>
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
                        <div className="flex items-center gap-2">
                          {getStatusIcon(repair.status)}
                          <Badge className={getStatusColor(repair.status)}>
                            {repair.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(
                          viewMode === "assigned" 
                            ? repair.assigned_date || repair.requested_date || ""
                            : repair.requested_date || ""
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {repair.estimated_cost ? `₦${repair.estimated_cost.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {viewMode === "available" && !repair.service_provider_id ? (
                            <Button
                              size="sm"
                              onClick={() => handleSelfAssign(repair)}
                              disabled={isAssigning && assigningId === repair.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isAssigning && assigningId === repair.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Claiming...
                                </>
                              ) : (
                                "Claim"
                              )}
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedRepair(repair)
                                  setShowDetailModal(true)
                                }}
                              >
                                View
                              </Button>
                              {viewMode === "assigned" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRepair(repair)
                                    setShowUpdateModal(true)
                                  }}
                                >
                                  Update
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedRepair && (
        <>
          <RepairDetailModal
            repair={selectedRepair}
            open={showDetailModal}
            onOpenChange={setShowDetailModal}
          />
          <UpdateRepairStatusModal
            repair={selectedRepair}
            open={showUpdateModal}
            onOpenChange={setShowUpdateModal}
            onSuccess={() => {
              mutate()
              setShowUpdateModal(false)
            }}
          />
        </>
      )}
    </div>
  )
}
