import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Monitor,
  Wrench,
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
} from "lucide-react"

export function SystemOverview() {
  const systemStats = {
    totalDevices: 248,
    activeRepairs: 23,
    totalUsers: 156,
    serviceProviders: 8,
    monthlyRepairs: 89,
    avgRepairTime: 8.5,
    systemUptime: 99.8,
    pendingApprovals: 8,
  }

  const regionalStats = [
    { region: "Head Office", devices: 89, repairs: 8, users: 45 },
    { region: "Accra", devices: 67, repairs: 6, users: 38 },
    { region: "Kumasi", devices: 45, repairs: 4, users: 28 },
    { region: "Kaase Inland Port", devices: 32, repairs: 3, users: 25 },
    { region: "Cape Coast", devices: 15, repairs: 2, users: 20 },
  ]

  const recentAlerts = [
    {
      id: 1,
      type: "warning",
      message: "Service provider TechFix Ghana has exceeded 2-week repair deadline",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "info",
      message: "New user registration: Akosua Mensah (Kaase Inland Port office)",
      time: "4 hours ago",
    },
    {
      id: 3,
      type: "success",
      message: "Monthly backup completed successfully",
      time: "1 day ago",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Repairs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.activeRepairs}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -5 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Repair Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.avgRepairTime}d</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -1.2 days improved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current system performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Uptime</span>
                <span className="text-sm text-muted-foreground">{systemStats.systemUptime}%</span>
              </div>
              <Progress value={systemStats.systemUptime} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database Performance</span>
                <span className="text-sm text-muted-foreground">95.2%</span>
              </div>
              <Progress value={95.2} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">API Response Time</span>
                <span className="text-sm text-muted-foreground">98.7%</span>
              </div>
              <Progress value={98.7} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Storage Usage</span>
                <span className="text-sm text-muted-foreground">67.3%</span>
              </div>
              <Progress value={67.3} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent System Alerts</CardTitle>
            <CardDescription>Latest system notifications and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                    {alert.type === "info" && <Monitor className="h-4 w-4 text-orange-500" />}
                    {alert.type === "success" && <CheckCircle className="h-4 w-4 text-orange-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Overview</CardTitle>
          <CardDescription>Device and repair statistics by location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {regionalStats.map((region) => (
              <div key={region.region} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">{region.region}</h4>
                    <p className="text-sm text-muted-foreground">{region.users} users</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium">{region.devices}</p>
                    <p className="text-muted-foreground">Devices</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{region.repairs}</p>
                    <p className="text-muted-foreground">Active Repairs</p>
                  </div>
                  <Badge variant={region.repairs > 5 ? "destructive" : region.repairs > 2 ? "secondary" : "default"}>
                    {region.repairs > 5 ? "High Load" : region.repairs > 2 ? "Moderate" : "Normal"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
