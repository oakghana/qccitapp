"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Monitor, Wrench, CheckCircle, AlertTriangle, Clock, Users, Plus, Settings, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DashboardNavigation } from "@/components/ui/dashboard-navigation"

export function DashboardOverview() {
  const router = useRouter()
  const { user } = useAuth()
  const [showAlerts, setShowAlerts] = useState(false)

  const handleNewRepairRequest = () => {
    router.push("/dashboard/repairs")
  }

  const handleAddNewDevice = () => {
    router.push("/dashboard/devices")
  }

  const handleManageUsers = () => {
    router.push("/dashboard/admin")
  }

  const handleViewAlerts = () => {
    setShowAlerts(true)
  }

  const alerts = [
    {
      id: 1,
      type: "warning",
      title: "Overdue Repair",
      message: "Dell Laptop #DL-2024-001 repair is overdue by 3 days",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "info",
      title: "New Service Provider",
      message: "Natland Computers has been added as a service provider",
      time: "1 day ago",
    },
    {
      id: 3,
      type: "success",
      title: "Repair Completed",
      message: "HP Printer #HP-2024-045 repair has been completed",
      time: "2 days ago",
    },
  ]

  const getStats = () => {
    if (user?.role === "service_provider") {
      return [
        {
          title: "Assigned Tasks",
          value: "12",
          description: "Total repair assignments",
          icon: Wrench,
          trend: "+3 this week",
        },
        {
          title: "In Progress",
          value: "5",
          description: "Currently working on",
          icon: Clock,
          trend: "+2 from yesterday",
        },
        {
          title: "Completed",
          value: "28",
          description: "This month",
          icon: CheckCircle,
          trend: "+15 from last month",
        },
        {
          title: "Ready for Return",
          value: "3",
          description: "Awaiting pickup",
          icon: Calendar,
          trend: "+1 today",
        },
      ]
    }

    return [
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
  }

  const getRecentActivity = () => {
    if (user?.role === "service_provider") {
      return [
        {
          id: 1,
          type: "repair_assigned",
          device: "Dell Laptop #DL-2024-001",
          user: "Head Office IT",
          region: "Accra",
          status: "assigned",
          time: "2 hours ago",
        },
        {
          id: 2,
          type: "repair_completed",
          device: "HP Printer #HP-2024-045",
          user: "Natland Computers",
          region: "Ready for Return",
          status: "completed",
          time: "4 hours ago",
        },
        {
          id: 3,
          type: "repair_in_progress",
          device: "Lenovo Desktop #LD-2024-012",
          user: "Natland Computers",
          region: "In Progress",
          status: "in_progress",
          time: "1 day ago",
        },
      ]
    }

    return [
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
  }

  const stats = getStats()
  const recentActivity = getRecentActivity()

  return (
    <div className="space-y-6">
      <DashboardNavigation />

      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {user?.role === "service_provider" ? "Natland Repairs Dashboard" : "Dashboard"}
        </h1>
        <p className="text-muted-foreground">
          {user?.role === "service_provider"
            ? "Manage your assigned repair tasks and track progress"
            : "Welcome to the IT Device Tracking System"}
        </p>
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
            <CardDescription>
              {user?.role === "service_provider"
                ? "Latest repair assignments and updates"
                : "Latest device movements and repair requests"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {(activity.type === "repair_request" || activity.type === "repair_assigned") && (
                      <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-orange-600" />
                      </div>
                    )}
                    {(activity.type === "device_transfer" || activity.type === "repair_in_progress") && (
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
            {user?.role === "service_provider" ? (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={() => router.push("/dashboard/assigned-repairs")}
                >
                  <Wrench className="h-5 w-5 mr-3 text-primary" />
                  <span className="text-sm font-medium">View Assigned Repairs</span>
                </Button>

                <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={handleViewAlerts}
                    >
                      <AlertTriangle className="h-5 w-5 mr-3 text-primary" />
                      <span className="text-sm font-medium">View Notifications</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Repair Notifications</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {alerts.map((alert) => (
                        <div key={alert.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                          <div
                            className={`h-2 w-2 rounded-full mt-2 ${
                              alert.type === "warning"
                                ? "bg-orange-500"
                                : alert.type === "success"
                                  ? "bg-green-500"
                                  : "bg-blue-500"
                            }`}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.title}</p>
                            <p className="text-xs text-muted-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                {/* Regular user quick actions */}
                {user?.role !== "user" && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={handleNewRepairRequest}
                    >
                      <Wrench className="h-5 w-5 mr-3 text-primary" />
                      <span className="text-sm font-medium">New Repair Request</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={handleAddNewDevice}
                    >
                      <Monitor className="h-5 w-5 mr-3 text-primary" />
                      <span className="text-sm font-medium">Add New Device</span>
                    </Button>
                  </>
                )}

                {(user?.role === "admin" || user?.role === "it_head") && (
                  <Button variant="outline" className="w-full justify-start bg-transparent" onClick={handleManageUsers}>
                    <Users className="h-5 w-5 mr-3 text-primary" />
                    <span className="text-sm font-medium">Manage Users</span>
                  </Button>
                )}

                {user?.role === "user" && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => router.push("/dashboard/complaints")}
                    >
                      <Plus className="h-5 w-5 mr-3 text-primary" />
                      <span className="text-sm font-medium">Submit Complaint</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => router.push("/dashboard/service-desk")}
                    >
                      <Settings className="h-5 w-5 mr-3 text-primary" />
                      <span className="text-sm font-medium">My Service Requests</span>
                    </Button>
                  </>
                )}

                {(user?.role === "service_desk_admin" || user?.role === "service_desk_head") && (
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                    onClick={() => router.push("/dashboard/service-desk")}
                  >
                    <Settings className="h-5 w-5 mr-3 text-primary" />
                    <span className="text-sm font-medium">Service Desk</span>
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
