import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Monitor, Wrench, CheckCircle, AlertTriangle, Clock, Users } from "lucide-react"

export function DashboardOverview() {
  const stats = [
    {
      title: "Total Devices",
      value: "248",
      description: "Across all regions",
      icon: Monitor,
      trend: "+12 from last month",
    },
    {
      title: "Active Repairs",
      value: "23",
      description: "Currently in progress",
      icon: Wrench,
      trend: "-5 from last week",
    },
    {
      title: "Completed Repairs",
      value: "156",
      description: "This month",
      icon: CheckCircle,
      trend: "+28 from last month",
    },
    {
      title: "Pending Approvals",
      value: "8",
      description: "Awaiting IT head review",
      icon: Clock,
      trend: "+3 from yesterday",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: "repair_request",
      device: "Dell Laptop #DL-2024-001",
      user: "Kwame Asante",
      region: "Accra",
      status: "pending",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "device_transfer",
      device: "HP Printer #HP-2024-045",
      user: "Ama Osei",
      region: "Kumasi → Head Office",
      status: "completed",
      time: "4 hours ago",
    },
    {
      id: 3,
      type: "repair_completed",
      device: "Lenovo Desktop #LD-2024-012",
      user: "Kofi Mensah",
      region: "Tamale",
      status: "completed",
      time: "6 hours ago",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the IT Device Tracking System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              <p className="text-xs text-primary mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest device movements and repair requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {activity.type === "repair_request" && (
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-orange-600" />
                      </div>
                    )}
                    {activity.type === "device_transfer" && (
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Monitor className="h-4 w-4 text-blue-600" />
                      </div>
                    )}
                    {activity.type === "repair_completed" && (
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{activity.device}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.user} • {activity.region}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={activity.status === "completed" ? "default" : "secondary"}>{activity.status}</Badge>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
              <Wrench className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">New Repair Request</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
              <Monitor className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Add New Device</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Manage Users</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">View Alerts</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
