"use client"

import { useEffect, useState } from "react"
import { dateFmt } from "@/lib/format-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, User, Shield, Database, Settings, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  resource: string
  details: string
  ipAddress: string
  userAgent: string
  severity: "low" | "medium" | "high" | "critical"
}

const severityColors = {
  low: "outline",
  medium: "secondary",
  high: "secondary",
  critical: "destructive",
} as const

const actionIcons = {
  USER_LOGIN: User,
  USER_LOGOUT: User,
  USER_SUSPENDED: Shield,
  REPAIR_APPROVED: FileText,
  BACKUP_COMPLETED: Database,
  LOGIN_FAILED: Shield,
  SETTINGS_CHANGED: Settings,
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const supabase = createClient()

  useEffect(() => {
    loadAuditLogs()
  }, [searchQuery, severityFilter, actionFilter])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50)

      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter)
      }

      if (actionFilter !== "all") {
        if (actionFilter === "login") {
          query = query.or("action.eq.USER_LOGIN,action.eq.USER_LOGOUT,action.eq.LOGIN_FAILED")
        } else if (actionFilter === "repair") {
          query = query.like("action", "%REPAIR%")
        } else if (actionFilter === "user") {
          query = query.or("action.eq.USER_CREATED,action.eq.USER_UPDATED,action.eq.USER_SUSPENDED")
        } else if (actionFilter === "system") {
          query = query.or("action.eq.BACKUP_COMPLETED,action.eq.SETTINGS_CHANGED")
        }
      }

      if (searchQuery.trim()) {
        query = query.or(
          `username.ilike.%${searchQuery}%,action.ilike.%${searchQuery}%,resource.ilike.%${searchQuery}%`,
        )
      }

      const { data, error } = await query

      if (error) {
        console.error("Error loading audit logs:", error)
        setLogs([])
        return
      }

      const mappedLogs = (data || []).map((log: any) => ({
        id: log.id,
        timestamp: log.created_at,
        user: log.username,
        action: log.action,
        resource: log.resource || "N/A",
        details: log.details || "",
        ipAddress: log.ip_address || "unknown",
        userAgent: log.user_agent || "unknown",
        severity: log.severity || "low",
      }))

      setLogs(mappedLogs)
    } catch (error) {
      console.error("Error loading audit logs:", error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Audit Logs</h2>
        <p className="text-muted-foreground">System activity logs and security events</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs by user, action, or resource..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login Events</SelectItem>
                <SelectItem value="repair">Repair Actions</SelectItem>
                <SelectItem value="user">User Management</SelectItem>
                <SelectItem value="system">System Events</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading audit logs...</CardContent>
          </Card>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No audit logs found</p>
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => {
            const ActionIcon = actionIcons[log.action as keyof typeof actionIcons] || FileText

            return (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ActionIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{log.action.replace(/_/g, " ")}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>{log.user}</span>
                          <span>•</span>
                          <span>{dateFmt(log.timestamp)}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={severityColors[log.severity]}>
                      {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{log.details}</p>
                      <p className="text-sm text-muted-foreground">Resource: {log.resource}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">IP Address:</span> {log.ipAddress}
                      </div>
                      <div>
                        <span className="font-medium">Log ID:</span> {log.id}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">User Agent:</span> {log.userAgent}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
