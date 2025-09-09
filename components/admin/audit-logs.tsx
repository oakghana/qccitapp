import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, User, Shield, Database, Settings, FileText } from "lucide-react"

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

const mockAuditLogs: AuditLog[] = [
  {
    id: "LOG-001",
    timestamp: "2024-03-02T10:30:15Z",
    user: "john.doe@company.com",
    action: "USER_LOGIN",
    resource: "Authentication System",
    details: "Successful login with OTP verification",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    severity: "low",
  },
  {
    id: "LOG-002",
    timestamp: "2024-03-02T09:45:22Z",
    user: "ama.osei@company.com",
    action: "REPAIR_APPROVED",
    resource: "Repair Request RR-2024-001",
    details: "Approved repair request for Dell Latitude 5520",
    ipAddress: "192.168.1.105",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    severity: "medium",
  },
  {
    id: "LOG-003",
    timestamp: "2024-03-02T08:20:33Z",
    user: "system@company.com",
    action: "BACKUP_COMPLETED",
    resource: "Database",
    details: "Daily database backup completed successfully",
    ipAddress: "127.0.0.1",
    userAgent: "System Process",
    severity: "low",
  },
  {
    id: "LOG-004",
    timestamp: "2024-03-01T16:15:44Z",
    user: "john.doe@company.com",
    action: "USER_SUSPENDED",
    resource: "User Account USR-004",
    details: "Suspended user account for Kofi Mensah due to inactivity",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    severity: "high",
  },
  {
    id: "LOG-005",
    timestamp: "2024-03-01T14:30:12Z",
    user: "unknown",
    action: "LOGIN_FAILED",
    resource: "Authentication System",
    details: "Failed login attempt - invalid credentials",
    ipAddress: "203.0.113.45",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    severity: "critical",
  },
]

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
                <Input placeholder="Search logs by user, action, or resource..." className="pl-10" />
              </div>
            </div>
            <Select defaultValue="all">
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
            <Select defaultValue="all">
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
        {mockAuditLogs.map((log) => {
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
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
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
        })}
      </div>
    </div>
  )
}
