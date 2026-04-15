"use client"

import { useState } from "react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, AlertTriangle, CheckCircle2, Clock, Wrench } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface GlobalRepairTrackerProps {
  allServiceProviders?: any[]
}

export function GlobalRepairTracker({
  allServiceProviders = [],
}: GlobalRepairTrackerProps) {
  const [status, setStatus] = useState("all")
  const [priority, setPriority] = useState("all")
  const [serviceProviderId, setServiceProviderId] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const queryParams = new URLSearchParams()
  if (status !== "all") queryParams.append("status", status)
  if (priority !== "all") queryParams.append("priority", priority)
  if (serviceProviderId !== "all") queryParams.append("serviceProviderId", serviceProviderId)
  if (searchTerm) queryParams.append("search", searchTerm)

  const { data, isLoading, error } = useSWR(
    `/api/repairs/all-repairs?${queryParams.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const repairs = data?.repairs || []
  const stats = data?.stats || {}

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
        return <Clock className="h-4 w-4" />
      case "in_progress":
        return <Wrench className="h-4 w-4" />
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />
      case "returned":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Global Repair Tracker</h1>
        <p className="text-muted-foreground">
          Monitor all device repairs across all locations and service providers
        </p>
      </div>

      {/* Statistics */}
      {!isLoading && stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Repairs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pending || 0}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.byStatus?.assigned || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.byStatus?.in_progress || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.byStatus?.completed || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter repairs by various criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <Input
              placeholder="Search by task number, device, or issue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={serviceProviderId} onValueChange={setServiceProviderId}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by service provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {allServiceProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(status !== "all" || priority !== "all" || serviceProviderId !== "all" || searchTerm) && (
            <Button
              variant="outline"
              onClick={() => {
                setStatus("all")
                setPriority("all")
                setServiceProviderId("all")
                setSearchTerm("")
              }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Repairs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Repairs</CardTitle>
          <CardDescription>Showing {repairs.length} repairs</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              Failed to load repairs. Please try again.
            </div>
          ) : repairs.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
              <p className="mt-2 text-muted-foreground">
                {searchTerm ? "No repairs match your filters" : "No repairs found"}
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
                    <TableHead>Service Provider</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repairs.map((repair: any) => (
                    <TableRow key={repair.id}>
                      <TableCell className="font-medium">{repair.task_number}</TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium">
                          {repair.device_info?.brand} {repair.device_info?.model}
                        </div>
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
                        <div className="flex items-center gap-1">
                          {getStatusIcon(repair.status)}
                          <Badge className={getStatusColor(repair.status)}>
                            {repair.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {repair.service_providers?.name || "Unassigned"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {repair.devices?.location || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(repair.assigned_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {repair.actual_cost
                          ? `₦${repair.actual_cost.toLocaleString()}`
                          : repair.estimated_cost
                            ? `Est: ₦${repair.estimated_cost.toLocaleString()}`
                            : "—"}
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
