"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, ChevronDown, ChevronRight, Trash2, Loader2, Copy, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface DuplicateGroup {
  serial_number: string
  count: number
  devices: any[]
}

export function DuplicateDeviceChecker() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<DuplicateGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({ totalDuplicates: 0, affectedSerials: 0 })

  const canAccess =
    user?.role === "admin" ||
    user?.role === "regional_it_head" ||
    user?.role === "it_head" ||
    user?.role === "it_staff"

  useEffect(() => {
    if (canAccess) loadDuplicates()
  }, [user])

  const loadDuplicates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        userRole: user?.role || "",
        location: user?.location || "",
      })
      const res = await fetch(`/api/devices/duplicates?${params}`)
      const data = await res.json()
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" })
        return
      }
      setGroups(data.duplicateGroups || [])
      setStats({
        totalDuplicates: data.totalDuplicates || 0,
        affectedSerials: data.affectedSerials || 0,
      })
    } catch {
      toast({ title: "Error", description: "Failed to load duplicates", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (deviceId: string, serial: string) => {
    if (!window.confirm(`Delete this duplicate device entry (${serial})?`)) return
    setDeletingId(deviceId)
    try {
      const res = await fetch("/api/devices/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          userId: user?.id,
          userRole: user?.role,
          userLocation: user?.location,
          reason: "Duplicate device entry correction",
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      } else {
        toast({ title: "Deleted", description: "Duplicate entry removed." })
        loadDuplicates()
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete device", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  const toggleExpand = (serial: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(serial) ? next.delete(serial) : next.add(serial)
      return next
    })
  }

  if (!canAccess) return null

  return (
    <Card className="border-green-200 dark:border-green-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Duplicate Device Entries
          </CardTitle>
          <CardDescription>
            Devices with the same serial number registered multiple times
            {user?.role === "regional_it_head" && ` at ${user.location}`}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={loadDuplicates} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-green-500" /> : "Refresh"}
        </Button>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
            <p className="font-medium text-green-700">No duplicate entries found</p>
            <p className="text-sm text-muted-foreground mt-1">All serial numbers are unique.</p>
          </div>
        ) : (
          <>
            {/* Summary badges */}
            <div className="flex gap-3 mb-4">
              <Badge variant="destructive" className="text-sm px-3 py-1">
                {stats.totalDuplicates} extra entr{stats.totalDuplicates === 1 ? "y" : "ies"}
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {stats.affectedSerials} serial{stats.affectedSerials === 1 ? "" : "s"} affected
              </Badge>
            </div>

            <div className="space-y-3">
              {groups.map((group) => {
                const isExpanded = expanded.has(group.serial_number)
                return (
                  <div
                    key={group.serial_number}
                    className="border border-green-200 dark:border-green-800 rounded-lg overflow-hidden"
                  >
                    {/* Group header */}
                    <button
                      className="w-full flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors text-left"
                      onClick={() => toggleExpand(group.serial_number)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-green-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-green-600" />
                        )}
                        <Copy className="h-4 w-4 text-amber-500" />
                        <span className="font-mono font-medium text-sm">{group.serial_number}</span>
                        <Badge variant="destructive" className="text-xs">{group.count} entries</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {group.devices[0]?.brand} {group.devices[0]?.model}
                      </span>
                    </button>

                    {/* Expanded device list */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Brand / Model</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Asset Tag</TableHead>
                              <TableHead>Added</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.devices.map((device, idx) => (
                              <TableRow
                                key={device.id}
                                className={cn(idx === 0 && "bg-green-50/50 dark:bg-green-950/20")}
                              >
                                <TableCell className="font-mono text-xs">{device.id.slice(0, 8)}…</TableCell>
                                <TableCell>
                                  {device.brand} {device.model}
                                </TableCell>
                                <TableCell>{device.location || "—"}</TableCell>
                                <TableCell>
                                  <Badge variant={device.status === "active" ? "default" : "secondary"}>
                                    {device.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{device.asset_tag || "—"}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {new Date(device.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {idx === 0 ? (
                                    <Badge variant="outline" className="text-green-600 border-green-400 text-xs">
                                      Keep (oldest)
                                    </Badge>
                                  ) : (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="h-7 text-xs"
                                      disabled={deletingId === device.id}
                                      onClick={() => handleDelete(device.id, group.serial_number)}
                                    >
                                      {deletingId === device.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <><Trash2 className="h-3 w-3 mr-1" />Delete</>
                                      )}
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
