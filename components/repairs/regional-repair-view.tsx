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
import { Loader2, Building2, MapPin, Wrench } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface RegionalRepairViewProps {
  regionId: string
  regionName: string
}

export function RegionalRepairView({ regionId, regionName }: RegionalRepairViewProps) {
  const [viewType, setViewType] = useState<"regional" | "head_office" | "all">("all")
  const [searchTerm, setSearchTerm] = useState("")

  const { data, isLoading, error } = useSWR(
    `/api/repairs/regional-repairs?regionId=${regionId}&type=${viewType}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const repairs = data?.results || {}

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
                {filtered.map((repair: any) => (
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Devices Under Repair - {regionName}</h2>
        <p className="text-muted-foreground">
          Track all devices from your region that are currently under repair
        </p>
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
