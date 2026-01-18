"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  FileText,
  Download,
  Users,
  Headphones,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Filter,
  Shield,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { canSeeAllLocations } from "@/lib/location-filter"
import { createClient } from "@/supabase/supabase-client"
import { LOCATIONS } from "@/lib/locations"

interface ReportData {
  location: string
  totalTickets: number
  resolvedTickets: number
  pendingTickets: number
  avgResolutionTime: number
  staffCount: number
  deviceCount: number
  repairRequests: number
  satisfactionScore: number
}

interface TimeSeriesData {
  date: string
  tickets: number
  repairs: number
  satisfaction: number
}

interface CategoryData {
  category: string
  count: number
  percentage: number
  color: string
}

export function ITReportsDashboard() {
  const { user } = useAuth()
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [selectedLocation, setSelectedLocation] = useState(
    user && user.role === "regional_it_head" ? user.location : "all",
  )
  const [dateRange, setDateRange] = useState("30") // days
  const [reportType, setReportType] = useState("overview")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [availableLocations, setAvailableLocations] = useState<string[]>([])

  // Fetch real data from database
  const fetchReportData = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    const supabase = createClient()
    
    try {
      // Calculate date range
      const daysAgo = parseInt(dateRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)
      const startDateStr = startDate.toISOString()
      
      // Get unique locations from devices
      const { data: deviceLocations } = await supabase
        .from("devices")
        .select("location")
        .not("location", "is", null)
      
      const uniqueLocations = [...new Set(deviceLocations?.map(d => d.location).filter(Boolean) || [])]
      setAvailableLocations(uniqueLocations)
      
      // Filter locations based on user role
      let locationsToQuery = uniqueLocations
      if (user.role === "regional_it_head" && user.location) {
        locationsToQuery = [user.location]
      }
      
      // Build report data for each location
      const reportDataPromises = locationsToQuery.map(async (location) => {
        // Get service tickets for this location
        let ticketQuery = supabase
          .from("service_tickets")
          .select("id, status, created_at, resolved_at, category")
          .gte("created_at", startDateStr)
          .ilike("location", location)
        
        const { data: tickets } = await ticketQuery
        
        const totalTickets = tickets?.length || 0
        const resolvedTickets = tickets?.filter(t => t.status === "resolved" || t.status === "closed").length || 0
        const pendingTickets = tickets?.filter(t => t.status !== "resolved" && t.status !== "closed").length || 0
        
        // Calculate average resolution time (in hours)
        const resolvedWithTime = tickets?.filter(t => t.resolved_at && t.created_at) || []
        let avgResolutionTime = 0
        if (resolvedWithTime.length > 0) {
          const totalHours = resolvedWithTime.reduce((acc, t) => {
            const created = new Date(t.created_at).getTime()
            const resolved = new Date(t.resolved_at).getTime()
            return acc + (resolved - created) / (1000 * 60 * 60)
          }, 0)
          avgResolutionTime = totalHours / resolvedWithTime.length
        }
        
        // Get staff count for this location
        const { count: staffCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .ilike("location", location)
          .in("role", ["it_staff", "regional_it_head", "service_desk_accra", "service_desk_kumasi", "service_desk_takoradi", "service_desk_tema", "service_desk_sunyani", "service_desk_cape_coast"])
        
        // Get device count for this location
        const { count: deviceCount } = await supabase
          .from("devices")
          .select("*", { count: "exact", head: true })
          .ilike("location", location)
        
        // Get repair requests for this location
        const { count: repairRequests } = await supabase
          .from("repair_requests")
          .select("*", { count: "exact", head: true })
          .gte("created_at", startDateStr)
          .ilike("location", location)
        
        return {
          location,
          totalTickets,
          resolvedTickets,
          pendingTickets,
          avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
          staffCount: staffCount || 0,
          deviceCount: deviceCount || 0,
          repairRequests: repairRequests || 0,
          satisfactionScore: 0, // No satisfaction tracking implemented yet
        }
      })
      
      const reportResults = await Promise.all(reportDataPromises)
      setReportData(reportResults.filter(r => r.totalTickets > 0 || r.deviceCount > 0 || r.staffCount > 0))
      
      // Build time series data (weekly aggregation)
      const weeks: TimeSeriesData[] = []
      for (let i = Math.min(8, Math.ceil(daysAgo / 7)); i >= 0; i--) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - (i * 7))
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        
        let ticketQuery = supabase
          .from("service_tickets")
          .select("id", { count: "exact", head: true })
          .gte("created_at", weekStart.toISOString())
          .lt("created_at", weekEnd.toISOString())
        
        if (user.role === "regional_it_head" && user.location) {
          ticketQuery = ticketQuery.ilike("location", user.location)
        }
        
        const { count: ticketCount } = await ticketQuery
        
        let repairQuery = supabase
          .from("repair_requests")
          .select("id", { count: "exact", head: true })
          .gte("created_at", weekStart.toISOString())
          .lt("created_at", weekEnd.toISOString())
        
        if (user.role === "regional_it_head" && user.location) {
          repairQuery = repairQuery.ilike("location", user.location)
        }
        
        const { count: repairCount } = await repairQuery
        
        weeks.push({
          date: weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          tickets: ticketCount || 0,
          repairs: repairCount || 0,
          satisfaction: 0,
        })
      }
      setTimeSeriesData(weeks)
      
      // Build category data from ticket categories
      let categoryQuery = supabase
        .from("service_tickets")
        .select("category")
        .gte("created_at", startDateStr)
        .not("category", "is", null)
      
      if (user.role === "regional_it_head" && user.location) {
        categoryQuery = categoryQuery.ilike("location", user.location)
      }
      
      const { data: categoryTickets } = await categoryQuery
      
      const categoryCounts: Record<string, number> = {}
      categoryTickets?.forEach(t => {
        if (t.category) {
          categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1
        }
      })
      
      const categoryColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"]
      const totalCategoryTickets = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
      
      const categoryDataResult: CategoryData[] = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([category, count], index) => ({
          category,
          count,
          percentage: totalCategoryTickets > 0 ? Math.round((count / totalCategoryTickets) * 100) : 0,
          color: categoryColors[index % categoryColors.length],
        }))
      
      setCategoryData(categoryDataResult)
      
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [user, dateRange])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  // Role-based access control - only IT Heads, Regional IT Heads, and Admins can access IT Reports
  const AccessDeniedComponent = () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-red-600">
            <Shield className="h-6 w-6" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            You don't have permission to view IT Reports. This feature is only available to IT Heads, Regional IT Heads,
            and System Administrators.
          </p>
          <Button variant="outline" onClick={() => window.history.back()} className="w-full">
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  if (!user || !["it_head", "regional_it_head", "admin"].includes(user.role)) {
    return <AccessDeniedComponent />
  }

  const generateReport = async () => {
    setIsGenerating(true)
    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsGenerating(false)

    // In a real app, this would generate and download a PDF/Excel report
    const reportContent = {
      reportType,
      location: selectedLocation,
      dateRange,
      generatedBy: user?.name,
      generatedAt: new Date().toISOString(),
      data: filteredReportData,
    }

    console.log("Generated Report:", reportContent)
    alert("Report generated successfully! In a real implementation, this would download a PDF/Excel file.")
  }

  const filteredReportData =
    selectedLocation === "all" ? reportData : reportData.filter((item) => item.location.toLowerCase() === selectedLocation.toLowerCase())

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    )
  }

  const totalStats = filteredReportData.reduce(
    (acc, curr) => ({
      totalTickets: acc.totalTickets + curr.totalTickets,
      resolvedTickets: acc.resolvedTickets + curr.resolvedTickets,
      pendingTickets: acc.pendingTickets + curr.pendingTickets,
      avgResolutionTime: acc.avgResolutionTime + curr.avgResolutionTime,
      staffCount: acc.staffCount + curr.staffCount,
      deviceCount: acc.deviceCount + curr.deviceCount,
      repairRequests: acc.repairRequests + curr.repairRequests,
      avgSatisfactionScore: acc.avgSatisfactionScore + curr.satisfactionScore,
    }),
    {
      totalTickets: 0,
      resolvedTickets: 0,
      pendingTickets: 0,
      avgResolutionTime: 0,
      staffCount: 0,
      deviceCount: 0,
      repairRequests: 0,
      avgSatisfactionScore: 0,
    },
  )

  // Calculate averages
  const locationCount = filteredReportData.length
  if (locationCount > 0) {
    totalStats.avgResolutionTime = totalStats.avgResolutionTime / locationCount
    totalStats.avgSatisfactionScore = totalStats.avgSatisfactionScore / locationCount
  }

  const resolutionRate =
    totalStats.totalTickets > 0 ? Math.round((totalStats.resolvedTickets / totalStats.totalTickets) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-yellow-600 flex items-center justify-center shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">IT Reports & Analytics</h1>
            <p className="text-muted-foreground">Generate comprehensive IT reports by location • QCC IT Management</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Quality Control Company Ltd.
          </Badge>
        </div>
      </div>

      {/* Report Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Configuration
          </CardTitle>
          <CardDescription>Configure and generate IT reports for your locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview Report</SelectItem>
                  <SelectItem value="performance">Performance Report</SelectItem>
                  <SelectItem value="tickets">Ticket Analysis</SelectItem>
                  <SelectItem value="devices">Device Status</SelectItem>
                  <SelectItem value="staff">Staff Productivity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={selectedLocation}
                onValueChange={setSelectedLocation}
                disabled={user?.role === "regional_it_head"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {canSeeAllLocations(user) && <SelectItem value="all">All Locations</SelectItem>}
                  {availableLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                  {availableLocations.length === 0 && LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateRange">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                  <SelectItem value="365">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={generateReport}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              Total Tickets
            </CardTitle>
            <div className="text-2xl font-bold">{totalStats.totalTickets}</div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resolved
            </CardTitle>
            <div className="text-2xl font-bold">{totalStats.resolvedTickets}</div>
            <p className="text-xs text-green-600">{resolutionRate}% resolution rate</p>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Pending
            </CardTitle>
            <div className="text-2xl font-bold">{totalStats.pendingTickets}</div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Resolution
            </CardTitle>
            <div className="text-2xl font-bold">{totalStats.avgResolutionTime.toFixed(1)}h</div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Staff
            </CardTitle>
            <div className="text-2xl font-bold">{totalStats.staffCount}</div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Satisfaction
            </CardTitle>
            <div className="text-2xl font-bold">{totalStats.avgSatisfactionScore.toFixed(1)}/5</div>
          </CardHeader>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Location Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Location</CardTitle>
            <CardDescription>Ticket resolution and satisfaction scores across locations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredReportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="resolvedTickets" fill="#10b981" name="Resolved Tickets" />
                <Bar dataKey="pendingTickets" fill="#f59e0b" name="Pending Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Trends</CardTitle>
            <CardDescription>Ticket volume and satisfaction over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tickets" stroke="#3b82f6" name="Tickets" strokeWidth={2} />
                <Line type="monotone" dataKey="repairs" stroke="#ef4444" name="Repairs" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Issue Categories */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Issue Categories Distribution</CardTitle>
            <CardDescription>Breakdown of ticket types and frequencies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: category.color }}></div>
                    <span className="font-medium">{category.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{category.count} tickets</span>
                    <Badge variant="outline">{category.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Location Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Location Performance Details</CardTitle>
          <CardDescription>Comprehensive performance metrics for each location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Location</th>
                  <th className="text-left p-3 font-semibold">Staff</th>
                  <th className="text-left p-3 font-semibold">Devices</th>
                  <th className="text-left p-3 font-semibold">Total Tickets</th>
                  <th className="text-left p-3 font-semibold">Resolution Rate</th>
                  <th className="text-left p-3 font-semibold">Avg Time</th>
                  <th className="text-left p-3 font-semibold">Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {filteredReportData.map((location, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="font-medium">{location.location}</div>
                    </td>
                    <td className="p-3">{location.staffCount}</td>
                    <td className="p-3">{location.deviceCount}</td>
                    <td className="p-3">{location.totalTickets}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {location.totalTickets > 0 ? (
                          <>
                            <span>{Math.round((location.resolvedTickets / location.totalTickets) * 100)}%</span>
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{
                                  width: `${(location.resolvedTickets / location.totalTickets) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">{location.avgResolutionTime}h</td>
                    <td className="p-3">
                      <Badge variant={location.satisfactionScore >= 4.5 ? "default" : "secondary"}>
                        {location.satisfactionScore}/5
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
