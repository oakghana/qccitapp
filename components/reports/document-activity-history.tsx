"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Upload, Trash2, RotateCcw, CheckCircle, Eye, Calendar, User, FileText } from "lucide-react"
import { format } from "date-fns"

interface AuditLog {
  id: string
  document_id: string
  action: "document_uploaded" | "document_deleted" | "document_restored" | "document_confirmed" | "document_viewed"
  user_name: string
  timestamp: string
  details?: Record<string, any>
}

interface ActivityHistoryProps {
  documentId: string
}

const actionConfig = {
  document_uploaded: {
    icon: Upload,
    label: "Uploaded",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  document_deleted: {
    icon: Trash2,
    label: "Deleted",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  document_restored: {
    icon: RotateCcw,
    label: "Restored",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  document_confirmed: {
    icon: CheckCircle,
    label: "Confirmed",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  document_viewed: {
    icon: Eye,
    label: "Viewed",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  },
}

export function DocumentActivityHistory({ documentId }: ActivityHistoryProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredAction, setFilteredAction] = useState<string>("all")

  useEffect(() => {
    fetchAuditTrail()
  }, [documentId])

  const fetchAuditTrail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/pdf-uploads/audit-trail?documentId=${documentId}`)
      const data = await response.json()

      if (data.success) {
        setAuditLogs(data.auditTrail || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching audit trail:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = auditLogs.filter(
    (log) => filteredAction === "all" || log.action === filteredAction
  )

  const getActionIcon = (action: string) => {
    const config = actionConfig[action as keyof typeof actionConfig]
    return config?.icon || FileText
  }

  const getActionLabel = (action: string) => {
    const config = actionConfig[action as keyof typeof actionConfig]
    return config?.label || action
  }

  const getActionColor = (action: string) => {
    const config = actionConfig[action as keyof typeof actionConfig]
    return config?.color || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading activity history...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Activity History
        </CardTitle>
        <CardDescription>
          Complete audit trail of all operations performed on this document
        </CardDescription>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground">No activity recorded for this document</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <Tabs value={filteredAction} onValueChange={setFilteredAction} className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                <TabsTrigger value="all" className="text-xs">
                  All
                </TabsTrigger>
                <TabsTrigger value="document_uploaded" className="text-xs">
                  Uploaded
                </TabsTrigger>
                <TabsTrigger value="document_deleted" className="text-xs">
                  Deleted
                </TabsTrigger>
                <TabsTrigger value="document_restored" className="text-xs">
                  Restored
                </TabsTrigger>
                <TabsTrigger value="document_confirmed" className="text-xs">
                  Confirmed
                </TabsTrigger>
                <TabsTrigger value="document_viewed" className="text-xs">
                  Viewed
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Activity Timeline */}
            <div className="space-y-3 mt-6">
              {filteredLogs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No {filteredAction !== "all" ? getActionLabel(filteredAction).toLowerCase() : "activity"} recorded
                </p>
              ) : (
                filteredLogs.map((log, index) => {
                  const ActionIcon = getActionIcon(log.action)
                  return (
                    <div
                      key={log.id}
                      className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0"
                    >
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center">
                        <div className={`p-2 rounded-full ${getActionColor(log.action)}`}>
                          <ActionIcon className="h-4 w-4" />
                        </div>
                        {index < filteredLogs.length - 1 && (
                          <div className="w-0.5 h-8 bg-border mt-2"></div>
                        )}
                      </div>

                      {/* Activity details */}
                      <div className="flex-1 pt-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-sm">
                              {getActionLabel(log.action)}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {log.user_name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(log.timestamp), "PPp")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Additional details */}
                        {log.details && (
                          <div className="mt-2 text-xs text-muted-foreground space-y-1">
                            {log.details.title && (
                              <p><span className="font-medium">Title:</span> {log.details.title}</p>
                            )}
                            {log.details.document_type && (
                              <p><span className="font-medium">Type:</span> {log.details.document_type}</p>
                            )}
                            {log.details.file_name && (
                              <p><span className="font-medium">File:</span> {log.details.file_name}</p>
                            )}
                            {log.details.file_size && (
                              <p><span className="font-medium">Size:</span> {(log.details.file_size / 1024).toFixed(2)} KB</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Total Actions</p>
                  <p className="text-lg font-semibold">{auditLogs.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">First Action</p>
                  <p className="text-sm font-semibold">
                    {auditLogs.length > 0
                      ? format(new Date(auditLogs[auditLogs.length - 1].timestamp), "MMM d, yyyy")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Last Action</p>
                  <p className="text-sm font-semibold">
                    {auditLogs.length > 0
                      ? format(new Date(auditLogs[0].timestamp), "MMM d, yyyy")
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Users Involved</p>
                  <p className="text-sm font-semibold">
                    {new Set(auditLogs.map((log) => log.user_name)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
