"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import {
  Download,
  Clock,
  DollarSign,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Building2,
  BarChart3,
  Filter,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { canSeeAllLocations } from "@/lib/location-filter"

interface RepairReport {
  period: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  totalCost: number
  avgRepairTime: number
  serviceProviderPerformance: {
    name: string
    tasksCompleted: number
    avgRepairTime: number
    totalCost: number
    rating: number
  }[]
  deviceTypes: {
    type: string
    count: number
    cost: number
    avgRepairTime: number
  }[]
  priorityBreakdown: {
    priority: string
    count: number
    avgResolutionTime: number
  }[]
  monthlyTrends: {
    month: string
    tasks: number
    cost: number
    completionRate: number
  }[]
  topIssues: {
    issue: string
    frequency: number
    avgCost: number
  }[]
}

interface ServiceProviderStats {
  id: string
  name: string
  company: string
  tasksAssigned: number
  tasksCompleted: number
  avgRepairTime: number
  totalCost: number
  completionRate: number
  rating: number
  onTimeDelivery: number
  recentTasks: {
    taskNumber: string
    deviceType: string
    status: string
    cost: number
    completedDate?: string
  }[]
}

export function ITHeadRepairReports() {
  const { user } = useAuth()
  const supabase = createClient()
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly")
  const [selectedProvider, setSelectedProvider] = useState<string>("all")
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [currentReport, setCurrentReport] = useState<RepairReport>({
    period: "",
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    totalCost: 0,
    avgRepairTime: 0,
    serviceProviderPerformance: [],
    deviceTypes: [],
    priorityBreakdown: [],
    monthlyTrends: [],
    topIssues: [],
  })
  const [providerStats, setProviderStats] = useState<ServiceProviderStats[]>([])
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState<any[]>([]) // Declare the reports variable

  useEffect(() => {
    generateReports()
  }, [reportPeriod, dateRange, selectedProvider, user])

  // Real-time subscription for repair updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('repair-reports-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'repair_requests'
        },
        (payload) => {
          console.log('[v0] Repair updated for reports:', payload)
          // Regenerate reports when any repair is updated
          generateReports()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, reportPeriod, dateRange, selectedProvider])

  const generateReports = async () => {
    if (!user) return

    setLoading(true)
    console.log("[v0] Generating repair reports from database...")

    try {
      let query = supabase
        .from("repair_requests")
        .select("*")
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end)

      if (!canSeeAllLocations(user) && user.location) {
        query = query.ilike("location", user.location)
      }

      const { data: repairs, error } = await query

      if (error) {
        console.error("[v0] Error loading repairs:", error)
        setLoading(false)
        return
      }

      console.log("[v0] Loaded repairs for report:", repairs?.length || 0)

      const totalTasks = repairs?.length || 0
      const completedTasks = repairs?.filter((r) => r.status === "completed").length || 0
      const inProgressTasks =
        repairs?.filter((r) => ["approved", "in_transit", "with_provider"].includes(r.status)).length || 0
      const overdueTasks =
        repairs?.filter((r) => {
          if (r.estimated_completion && r.status !== "completed") {
            return new Date(r.estimated_completion) < new Date()
          }
          return false
        }).length || 0

      const totalCost = repairs?.reduce((sum, r) => sum + (r.estimated_cost || 0), 0) || 0

      // Calculate average repair time for completed tasks
      const completedRepairs =
        repairs?.filter((r) => r.status === "completed" && r.approved_date && r.estimated_completion) || []
      const avgRepairTime =
        completedRepairs.length > 0
          ? completedRepairs.reduce((sum, r) => {
              const days =
                Math.abs(new Date(r.estimated_completion!).getTime() - new Date(r.approved_date!).getTime()) /
                (1000 * 60 * 60 * 24)
              return sum + days
            }, 0) / completedRepairs.length
          : 0

      setCurrentReport({
        period: `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        totalCost,
        avgRepairTime,
        serviceProviderPerformance: [],
        deviceTypes: [],
        priorityBreakdown: [],
        monthlyTrends: [],
        topIssues: [],
      })

      const { data: providers, error: providerError } = await supabase.from("service_providers").select("*")

      if (!providerError && providers) {
        setProviderStats(
          providers.map((p) => ({
            ...p,
            recentTasks: [],
          })),
        )
      }

      setReports(repairs) // Set the reports variable
    } catch (error) {
      console.error("[v0] Error generating reports:", error)
    } finally {
      setLoading(false)
    }
  }

  // Safe formatting helpers to avoid calling toFixed on undefined/null
  const fmt = (v: number | undefined | null, digits: number = 1) => {
    const n = typeof v === "number" && !isNaN(v) ? v : 0
    return n.toFixed(digits)
  }

  const pct = (num: number | undefined | null, denom: number | undefined | null, digits = 1) => {
    const n = typeof num === "number" && !isNaN(num) ? num : 0
    const d = typeof denom === "number" && denom > 0 ? denom : 0
    const val = d > 0 ? (n / d) * 100 : 0
    return val.toFixed(digits)
  }

  // Safe number formatting that guards against undefined/null and string values
  const numFmt = (
    v: number | string | undefined | null,
    locale: string = "en-GH",
    options?: Intl.NumberFormatOptions,
  ) => {
    const n = typeof v === "number" && !isNaN(v) ? v : typeof v === "string" && !isNaN(Number(v)) ? Number(v) : 0
    try {
      return n.toLocaleString(locale, options)
    } catch (e) {
      return String(n)
    }
  }

  const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#f97316", "#06b6d4"]

  const exportReport = () => {
    const reportData = {
      period: currentReport.period,
      generated: new Date().toISOString(),
      summary: {
        totalTasks: currentReport.totalTasks,
        completedTasks: currentReport.completedTasks,
        completionRate: pct(currentReport.completedTasks, currentReport.totalTasks, 1),
        totalCost: currentReport.totalCost,
        avgRepairTime: currentReport.avgRepairTime,
      },
      serviceProviders: currentReport.serviceProviderPerformance,
      deviceBreakdown: currentReport.deviceTypes,
      priorityAnalysis: currentReport.priorityBreakdown,
      topIssues: currentReport.topIssues,
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `repair-report-${reportPeriod}-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Repair Analytics & Reports</h1>
            <p className="text-muted-foreground">
              Comprehensive repair tracking with service provider performance • {user?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={exportReport}
            variant="outline"
            className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 border-green-200"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>

          <Button
            onClick={generateReports}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
          >
            {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="period">Report Period</Label>
              <Select value={reportPeriod} onValueChange={(value) => setReportPeriod(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Reports</SelectItem>
                  <SelectItem value="weekly">Weekly Reports</SelectItem>
                  <SelectItem value="monthly">Monthly Reports</SelectItem>
                  <SelectItem value="yearly">Yearly Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="provider">Service Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providerStats.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentReport.totalTasks}</div>
            <p className="text-xs text-muted-foreground">{currentReport.period || "Current period"}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentReport.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {currentReport.totalTasks > 0
                ? `${pct(currentReport.completedTasks, currentReport.totalTasks, 1)}% completion rate`
                : "0% completion rate"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentReport.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">Active repairs</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentReport.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              GHS{" "}
              {numFmt(currentReport.totalCost, "en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: GHS{" "}
              {currentReport.totalTasks > 0
                ? numFmt(currentReport.totalCost / currentReport.totalTasks, "en-GH", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                : "0"}
              /task
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="providers">Service Providers</TabsTrigger>
          <TabsTrigger value="devices">Device Analysis</TabsTrigger>
          <TabsTrigger value="issues">Issue Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Completed", value: currentReport.completedTasks, color: "#10b981" },
                        { name: "In Progress", value: currentReport.inProgressTasks, color: "#f59e0b" },
                        { name: "Overdue", value: currentReport.overdueTasks, color: "#ef4444" },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                    >
                      {[
                        { name: "Completed", value: currentReport.completedTasks, color: "#10b981" },
                        { name: "In Progress", value: currentReport.inProgressTasks, color: "#f59e0b" },
                        { name: "Overdue", value: currentReport.overdueTasks, color: "#ef4444" },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={currentReport.priorityBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Service Provider Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={currentReport.serviceProviderPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="tasks" orientation="left" />
                  <YAxis yAxisId="cost" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="tasks" dataKey="tasksCompleted" fill="#3b82f6" name="Tasks Completed" />
                  <Bar yAxisId="cost" dataKey="totalCost" fill="#10b981" name="Total Cost (GHS)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {reportPeriod === "monthly" || reportPeriod === "yearly" ? (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={currentReport.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="tasks" orientation="left" />
                    <YAxis yAxisId="cost" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="tasks" type="monotone" dataKey="tasks" stroke="#3b82f6" name="Tasks" />
                    <Line yAxisId="cost" type="monotone" dataKey="cost" stroke="#10b981" name="Cost (GHS)" />
                    <Line
                      yAxisId="tasks"
                      type="monotone"
                      dataKey="completionRate"
                      stroke="#f59e0b"
                      name="Completion Rate %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Historical Data</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={reports}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="created_at" /> {/* Use 'created_at' as dataKey */}
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="status" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Status" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Repair Time Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reports}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="created_at" /> {/* Use 'created_at' as dataKey */}
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="avgRepairTime" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={reports}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="created_at" /> {/* Use 'created_at' as dataKey */}
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="cost" stroke="#06b6d4" fill="#06b6d4" name="Cost (GHS)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid gap-6">
            {providerStats.map((provider) => (
              <Card key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {provider.name}
                      </CardTitle>
                      <CardDescription>{provider.company}</CardDescription>
                    </div>
                    <Badge
                      className={
                        provider.completionRate >= 90 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      ⭐ {provider.rating}/5.0
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="font-semibold">Performance Metrics</Label>
                        <div className="space-y-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span>Tasks Assigned:</span>
                            <span className="font-medium">{provider.tasksAssigned}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Tasks Completed:</span>
                            <span className="font-medium">{provider.tasksCompleted}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Completion Rate:</span>
                            <span className="font-medium">{fmt(provider.completionRate, 1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>On-time Delivery:</span>
                            <span className="font-medium">{fmt(provider.onTimeDelivery, 1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="font-semibold">Time & Cost</Label>
                        <div className="space-y-2 mt-2">
                          <div className="flex justify-between text-sm">
                            <span>Avg Repair Time:</span>
                            <span className="font-medium">{fmt(provider.avgRepairTime, 1)} days</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Cost:</span>
                            <span className="font-medium">GHS {numFmt(provider.totalCost)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Avg Cost per Task:</span>
                            <span className="font-medium">
                              GHS {fmt(provider.tasksCompleted ? provider.totalCost / provider.tasksCompleted : 0, 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Label className="font-semibold">Recent Tasks</Label>
                      <div className="space-y-2 mt-2">
                        {provider.recentTasks.map((task, index) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                            <div>
                              <span className="font-medium">{task.taskNumber}</span>
                              <span className="text-muted-foreground ml-2">• {task.deviceType}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                size="sm"
                                className={
                                  task.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-orange-100 text-orange-800"
                                }
                              >
                                {task.status}
                              </Badge>
                              <span className="font-medium">GHS {task.cost}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Device Type Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={currentReport.deviceTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis yAxisId="count" orientation="left" />
                  <YAxis yAxisId="cost" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="count" dataKey="count" fill="#3b82f6" name="Repair Count" />
                  <Bar yAxisId="cost" dataKey="cost" fill="#10b981" name="Total Cost (GHS)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Repair Distribution by Device Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={currentReport.deviceTypes} cx="50%" cy="50%" outerRadius={100} dataKey="count">
                      {currentReport.deviceTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Repair Time by Device</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentReport.deviceTypes.map((device, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{device.type}</span>
                        <span>{fmt(device.avgRepairTime, 1)} days</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(device.avgRepairTime / 6) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Issues by Frequency</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={currentReport.topIssues}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="issue" />
                  <YAxis yAxisId="frequency" orientation="left" />
                  <YAxis yAxisId="cost" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="frequency" dataKey="frequency" fill="#ef4444" name="Frequency" />
                  <Bar yAxisId="cost" dataKey="avgCost" fill="#f59e0b" name="Avg Cost (GHS)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Issue Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentReport.topIssues.map((issue, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{issue.issue}</p>
                      <p className="text-sm text-muted-foreground">
                        {issue.frequency} occurrences • Avg cost: GHS {issue.avgCost}
                      </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium">
                        Total Impact: GHS {numFmt(issue.frequency * issue.avgCost)}
                      </p>
                      <Badge variant="outline">
                        {pct(issue.frequency, currentReport.totalTasks, 1)}% of all issues
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
