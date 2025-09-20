"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// Mock data for analytics
const repairTrends = [
  { month: "Jan", requests: 45, completed: 38, pending: 7, cost: 12500 },
  { month: "Feb", requests: 52, completed: 48, pending: 4, cost: 15200 },
  { month: "Mar", requests: 38, completed: 35, pending: 3, cost: 9800 },
  { month: "Apr", requests: 61, completed: 55, pending: 6, cost: 18900 },
  { month: "May", requests: 47, completed: 44, pending: 3, cost: 13600 },
  { month: "Jun", requests: 55, completed: 51, pending: 4, cost: 16800 },
]

const serviceDeskTrends = [
  { month: "Jan", tickets: 128, resolved: 115, escalated: 8, avgTime: 4.2 },
  { month: "Feb", tickets: 142, resolved: 135, escalated: 5, avgTime: 3.8 },
  { month: "Mar", tickets: 98, resolved: 92, escalated: 4, avgTime: 3.5 },
  { month: "Apr", tickets: 156, resolved: 148, escalated: 6, avgTime: 4.1 },
  { month: "May", tickets: 134, resolved: 128, escalated: 4, avgTime: 3.9 },
  { month: "Jun", tickets: 167, resolved: 159, escalated: 7, avgTime: 4.3 },
]

const deviceBreakdown = [
  { name: "Laptops", value: 45, color: "#15803d" },
  { name: "Desktops", value: 32, color: "#84cc16" },
  { name: "Printers", value: 18, color: "#eab308" },
  { name: "Monitors", value: 25, color: "#f97316" },
  { name: "Others", value: 12, color: "#6b7280" },
]

const locationPerformance = [
  { location: "Head Office", repairs: 89, serviceDesk: 245, efficiency: 92 },
  { location: "Kumasi", repairs: 67, serviceDesk: 189, efficiency: 88 },
  { location: "Tamale", repairs: 34, serviceDesk: 98, efficiency: 85 },
  { location: "Cape Coast", repairs: 28, serviceDesk: 76, efficiency: 90 },
]

export function Analytics() {
  const [timeRange, setTimeRange] = useState("6months")
  const [activeTab, setActiveTab] = useState("overview")

  const totalRepairs = repairTrends.reduce((sum, item) => sum + item.requests, 0)
  const totalServiceDesk = serviceDeskTrends.reduce((sum, item) => sum + item.tickets, 0)
  const totalCost = repairTrends.reduce((sum, item) => sum + item.cost, 0)
  const avgResolutionTime = serviceDeskTrends.reduce((sum, item) => sum + item.avgTime, 0) / serviceDeskTrends.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics & Reports</h2>
          <p className="text-muted-foreground">Comprehensive insights for planning and procurement</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repairs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRepairs}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Desk Tickets</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServiceDesk}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +8% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₵{totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 inline mr-1" />
              -5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResolutionTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 inline mr-1" />
              -0.3h from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="repairs">Repairs</TabsTrigger>
          <TabsTrigger value="servicedesk">Service Desk</TabsTrigger>
          <TabsTrigger value="procurement">Procurement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends Comparison</CardTitle>
                <CardDescription>Repair requests vs Service desk tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={repairTrends.map((item, index) => ({
                      ...item,
                      serviceTickets: serviceDeskTrends[index]?.tickets || 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="requests" stroke="#15803d" name="Repair Requests" />
                    <Line type="monotone" dataKey="serviceTickets" stroke="#84cc16" name="Service Tickets" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>Most common device types requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Location Performance</CardTitle>
              <CardDescription>Performance metrics across all locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locationPerformance.map((location) => (
                  <div key={location.location} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{location.location}</h4>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>{location.repairs} repairs</span>
                        <span>{location.serviceDesk} tickets</span>
                      </div>
                    </div>
                    <Badge variant={location.efficiency >= 90 ? "default" : "secondary"}>
                      {location.efficiency}% efficiency
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repairs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Repair Request Trends</CardTitle>
                <CardDescription>Monthly repair request volume and completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={repairTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="requests" fill="#15803d" name="Total Requests" />
                    <Bar dataKey="completed" fill="#84cc16" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Repair Costs</CardTitle>
                <CardDescription>Monthly repair expenditure trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={repairTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₵${value.toLocaleString()}`, "Cost"]} />
                    <Line type="monotone" dataKey="cost" stroke="#f97316" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="servicedesk" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Desk Performance</CardTitle>
                <CardDescription>Ticket resolution and escalation trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={serviceDeskTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tickets" fill="#15803d" name="Total Tickets" />
                    <Bar dataKey="resolved" fill="#84cc16" name="Resolved" />
                    <Bar dataKey="escalated" fill="#f97316" name="Escalated" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Resolution Time</CardTitle>
                <CardDescription>Time to resolve service desk tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={serviceDeskTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} hours`, "Avg Time"]} />
                    <Line type="monotone" dataKey="avgTime" stroke="#6366f1" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="procurement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Procurement Recommendations</CardTitle>
              <CardDescription>Items requiring attention based on repair trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg border-orange-200 bg-orange-50">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <h4 className="font-medium">Laptop Batteries</h4>
                      <p className="text-sm text-muted-foreground">
                        High failure rate detected - consider bulk purchase
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">High Priority</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg border-yellow-200 bg-yellow-50">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h4 className="font-medium">Printer Toners</h4>
                      <p className="text-sm text-muted-foreground">Stock running low based on usage patterns</p>
                    </div>
                  </div>
                  <Badge variant="outline">Medium Priority</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg border-orange-200 bg-orange-50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-orange-600" />
                    <div>
                      <h4 className="font-medium">Monitor Cables</h4>
                      <p className="text-sm text-muted-foreground">Consider preventive replacement program</p>
                    </div>
                  </div>
                  <Badge variant="outline">Low Priority</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
