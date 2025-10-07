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
  AreaChart
} from "recharts"
import { 
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Wrench,
  CheckCircle,
  AlertTriangle,
  FileText,
  Building2,
  User,
  Package,
  Timer,
  BarChart3,
  Filter,
  RefreshCw
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

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
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly")
  const [selectedProvider, setSelectedProvider] = useState<string>("all")
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [reports, setReports] = useState<RepairReport[]>([])
  const [providerStats, setProviderStats] = useState<ServiceProviderStats[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    generateReports()
  }, [reportPeriod, dateRange, selectedProvider])

  const generateReports = async () => {
    setLoading(true)
    
    // Mock data generation based on report period
    const mockReports: RepairReport[] = []
    const mockProviderStats: ServiceProviderStats[] = [
      {
        id: "SP-001",
        name: "Natland IT Services",
        company: "Natland Technology Ltd",
        tasksAssigned: 45,
        tasksCompleted: 42,
        avgRepairTime: 2.8,
        totalCost: 18750.00,
        completionRate: 93.3,
        rating: 4.8,
        onTimeDelivery: 89.5,
        recentTasks: [
          {
            taskNumber: "QCC-RPR-2025-001",
            deviceType: "Laptop",
            status: "completed",
            cost: 320.00,
            completedDate: "2025-01-18T16:30:00Z"
          },
          {
            taskNumber: "QCC-RPR-2025-003",
            deviceType: "Desktop",
            status: "in_repair",
            cost: 480.00
          }
        ]
      },
      {
        id: "SP-002",
        name: "TechFix Ghana",
        company: "TechFix Solutions",
        tasksAssigned: 28,
        tasksCompleted: 25,
        avgRepairTime: 3.2,
        totalCost: 11200.00,
        completionRate: 89.3,
        rating: 4.5,
        onTimeDelivery: 84.0,
        recentTasks: [
          {
            taskNumber: "QCC-RPR-2025-002",
            deviceType: "Printer",
            status: "completed",
            cost: 280.00,
            completedDate: "2025-01-17T14:00:00Z"
          }
        ]
      }
    ]

    // Generate mock data based on period
    if (reportPeriod === "daily") {
      for (let i = 0; i < 30; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        
        mockReports.push({
          period: date.toISOString().split('T')[0],
          totalTasks: Math.floor(Math.random() * 8) + 2,
          completedTasks: Math.floor(Math.random() * 6) + 1,
          inProgressTasks: Math.floor(Math.random() * 4) + 1,
          overdueTasks: Math.floor(Math.random() * 2),
          totalCost: Math.random() * 2000 + 500,
          avgRepairTime: Math.random() * 3 + 1,
          serviceProviderPerformance: mockProviderStats.map(sp => ({
            name: sp.name,
            tasksCompleted: Math.floor(Math.random() * 3) + 1,
            avgRepairTime: Math.random() * 2 + 2,
            totalCost: Math.random() * 800 + 200,
            rating: sp.rating
          })),
          deviceTypes: [
            { type: "Laptop", count: Math.floor(Math.random() * 3) + 1, cost: Math.random() * 600 + 200, avgRepairTime: 2.5 },
            { type: "Desktop", count: Math.floor(Math.random() * 2) + 1, cost: Math.random() * 500 + 300, avgRepairTime: 3.0 },
            { type: "Printer", count: Math.floor(Math.random() * 2), cost: Math.random() * 300 + 150, avgRepairTime: 1.8 }
          ],
          priorityBreakdown: [
            { priority: "Critical", count: Math.floor(Math.random() * 2), avgResolutionTime: 1.2 },
            { priority: "High", count: Math.floor(Math.random() * 3) + 1, avgResolutionTime: 2.1 },
            { priority: "Medium", count: Math.floor(Math.random() * 4) + 2, avgResolutionTime: 3.5 },
            { priority: "Low", count: Math.floor(Math.random() * 2) + 1, avgResolutionTime: 5.2 }
          ],
          monthlyTrends: [],
          topIssues: [
            { issue: "Screen Issues", frequency: Math.floor(Math.random() * 3), avgCost: 350 },
            { issue: "Hardware Failure", frequency: Math.floor(Math.random() * 2), avgCost: 480 },
            { issue: "Software Problems", frequency: Math.floor(Math.random() * 4), avgCost: 120 }
          ]
        })
      }
    } else if (reportPeriod === "weekly") {
      for (let i = 0; i < 12; i++) {
        const endDate = new Date()
        endDate.setDate(endDate.getDate() - (i * 7))
        const startDate = new Date(endDate)
        startDate.setDate(startDate.getDate() - 6)
        
        mockReports.push({
          period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
          totalTasks: Math.floor(Math.random() * 40) + 15,
          completedTasks: Math.floor(Math.random() * 35) + 10,
          inProgressTasks: Math.floor(Math.random() * 8) + 2,
          overdueTasks: Math.floor(Math.random() * 5) + 1,
          totalCost: Math.random() * 12000 + 3000,
          avgRepairTime: Math.random() * 2 + 2.5,
          serviceProviderPerformance: mockProviderStats.map(sp => ({
            name: sp.name,
            tasksCompleted: Math.floor(Math.random() * 15) + 5,
            avgRepairTime: Math.random() * 1.5 + 2,
            totalCost: Math.random() * 6000 + 1500,
            rating: sp.rating
          })),
          deviceTypes: [
            { type: "Laptop", count: Math.floor(Math.random() * 12) + 5, cost: Math.random() * 4000 + 1500, avgRepairTime: 2.8 },
            { type: "Desktop", count: Math.floor(Math.random() * 8) + 3, cost: Math.random() * 3200 + 1200, avgRepairTime: 3.2 },
            { type: "Printer", count: Math.floor(Math.random() * 6) + 2, cost: Math.random() * 1800 + 800, avgRepairTime: 2.1 }
          ],
          priorityBreakdown: [
            { priority: "Critical", count: Math.floor(Math.random() * 5) + 1, avgResolutionTime: 1.5 },
            { priority: "High", count: Math.floor(Math.random() * 10) + 3, avgResolutionTime: 2.3 },
            { priority: "Medium", count: Math.floor(Math.random() * 15) + 8, avgResolutionTime: 3.8 },
            { priority: "Low", count: Math.floor(Math.random() * 8) + 3, avgResolutionTime: 5.5 }
          ],
          monthlyTrends: [],
          topIssues: [
            { issue: "Screen Issues", frequency: Math.floor(Math.random() * 8) + 2, avgCost: 380 },
            { issue: "Hardware Failure", frequency: Math.floor(Math.random() * 6) + 1, avgCost: 520 },
            { issue: "Software Problems", frequency: Math.floor(Math.random() * 12) + 4, avgCost: 150 }
          ]
        })
      }
    } else if (reportPeriod === "monthly") {
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
      
      for (let i = 0; i < 12; i++) {
        const month = months[11 - i]
        
        mockReports.push({
          period: `${month} 2025`,
          totalTasks: Math.floor(Math.random() * 150) + 60,
          completedTasks: Math.floor(Math.random() * 130) + 50,
          inProgressTasks: Math.floor(Math.random() * 25) + 5,
          overdueTasks: Math.floor(Math.random() * 15) + 2,
          totalCost: Math.random() * 45000 + 15000,
          avgRepairTime: Math.random() * 1.5 + 2.2,
          serviceProviderPerformance: mockProviderStats.map(sp => ({
            name: sp.name,
            tasksCompleted: Math.floor(Math.random() * 60) + 20,
            avgRepairTime: Math.random() * 1.2 + 2.5,
            totalCost: Math.random() * 22000 + 8000,
            rating: sp.rating
          })),
          deviceTypes: [
            { type: "Laptop", count: Math.floor(Math.random() * 45) + 20, cost: Math.random() * 18000 + 8000, avgRepairTime: 2.9 },
            { type: "Desktop", count: Math.floor(Math.random() * 30) + 15, cost: Math.random() * 15000 + 6000, avgRepairTime: 3.4 },
            { type: "Printer", count: Math.floor(Math.random() * 20) + 8, cost: Math.random() * 8000 + 3000, avgRepairTime: 2.2 }
          ],
          priorityBreakdown: [
            { priority: "Critical", count: Math.floor(Math.random() * 15) + 5, avgResolutionTime: 1.8 },
            { priority: "High", count: Math.floor(Math.random() * 35) + 15, avgResolutionTime: 2.5 },
            { priority: "Medium", count: Math.floor(Math.random() * 60) + 25, avgResolutionTime: 4.1 },
            { priority: "Low", count: Math.floor(Math.random() * 25) + 10, avgResolutionTime: 6.2 }
          ],
          monthlyTrends: months.slice(0, 12).map((m, idx) => ({
            month: m,
            tasks: Math.floor(Math.random() * 100) + 50,
            cost: Math.random() * 30000 + 10000,
            completionRate: Math.random() * 15 + 85
          })),
          topIssues: [
            { issue: "Screen Issues", frequency: Math.floor(Math.random() * 25) + 10, avgCost: 420 },
            { issue: "Hardware Failure", frequency: Math.floor(Math.random() * 20) + 8, avgCost: 580 },
            { issue: "Software Problems", frequency: Math.floor(Math.random() * 40) + 15, avgCost: 180 },
            { issue: "Network Connectivity", frequency: Math.floor(Math.random() * 15) + 5, avgCost: 250 },
            { issue: "Battery Issues", frequency: Math.floor(Math.random() * 18) + 6, avgCost: 320 }
          ]
        })
      }
    } else if (reportPeriod === "yearly") {
      for (let i = 0; i < 5; i++) {
        const year = 2025 - i
        
        mockReports.push({
          period: `Year ${year}`,
          totalTasks: Math.floor(Math.random() * 1500) + 800,
          completedTasks: Math.floor(Math.random() * 1300) + 700,
          inProgressTasks: Math.floor(Math.random() * 100) + 30,
          overdueTasks: Math.floor(Math.random() * 80) + 20,
          totalCost: Math.random() * 450000 + 200000,
          avgRepairTime: Math.random() * 1 + 2.8,
          serviceProviderPerformance: mockProviderStats.map(sp => ({
            name: sp.name,
            tasksCompleted: Math.floor(Math.random() * 600) + 300,
            avgRepairTime: Math.random() * 0.8 + 2.2,
            totalCost: Math.random() * 200000 + 100000,
            rating: sp.rating
          })),
          deviceTypes: [
            { type: "Laptop", count: Math.floor(Math.random() * 500) + 300, cost: Math.random() * 180000 + 90000, avgRepairTime: 3.1 },
            { type: "Desktop", count: Math.floor(Math.random() * 350) + 200, cost: Math.random() * 140000 + 70000, avgRepairTime: 3.6 },
            { type: "Printer", count: Math.floor(Math.random() * 200) + 100, cost: Math.random() * 80000 + 40000, avgRepairTime: 2.4 },
            { type: "Server", count: Math.floor(Math.random() * 50) + 10, cost: Math.random() * 60000 + 20000, avgRepairTime: 5.2 }
          ],
          priorityBreakdown: [
            { priority: "Critical", count: Math.floor(Math.random() * 120) + 60, avgResolutionTime: 2.1 },
            { priority: "High", count: Math.floor(Math.random() * 300) + 180, avgResolutionTime: 2.8 },
            { priority: "Medium", count: Math.floor(Math.random() * 600) + 350, avgResolutionTime: 4.5 },
            { priority: "Low", count: Math.floor(Math.random() * 250) + 120, avgResolutionTime: 7.1 }
          ],
          monthlyTrends: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, idx) => ({
            month: m,
            tasks: Math.floor(Math.random() * 120) + 60,
            cost: Math.random() * 40000 + 15000,
            completionRate: Math.random() * 10 + 88
          })),
          topIssues: [
            { issue: "Screen Issues", frequency: Math.floor(Math.random() * 200) + 100, avgCost: 450 },
            { issue: "Hardware Failure", frequency: Math.floor(Math.random() * 180) + 80, avgCost: 620 },
            { issue: "Software Problems", frequency: Math.floor(Math.random() * 350) + 200, avgCost: 200 },
            { issue: "Network Connectivity", frequency: Math.floor(Math.random() * 120) + 60, avgCost: 280 },
            { issue: "Battery Issues", frequency: Math.floor(Math.random() * 150) + 80, avgCost: 350 },
            { issue: "Memory Issues", frequency: Math.floor(Math.random() * 100) + 40, avgCost: 380 },
            { issue: "Storage Problems", frequency: Math.floor(Math.random() * 90) + 30, avgCost: 420 }
          ]
        })
      }
    }

    setReports(mockReports)
    setProviderStats(mockProviderStats)
    setLoading(false)
  }

  const currentReport = reports[0] || {
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
    topIssues: []
  }

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316', '#06b6d4']

  const exportReport = () => {
    const reportData = {
      period: currentReport.period,
      generated: new Date().toISOString(),
      summary: {
        totalTasks: currentReport.totalTasks,
        completedTasks: currentReport.completedTasks,
        completionRate: ((currentReport.completedTasks / currentReport.totalTasks) * 100).toFixed(1),
        totalCost: currentReport.totalCost,
        avgRepairTime: currentReport.avgRepairTime
      },
      serviceProviders: currentReport.serviceProviderPerformance,
      deviceBreakdown: currentReport.deviceTypes,
      priorityAnalysis: currentReport.priorityBreakdown,
      topIssues: currentReport.topIssues
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `repair-report-${reportPeriod}-${new Date().toISOString().split('T')[0]}.json`
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
                  <SelectItem value="SP-001">Natland IT Services</SelectItem>
                  <SelectItem value="SP-002">TechFix Ghana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Tasks
            </CardTitle>
            <div className="text-2xl font-bold">{currentReport.totalTasks}</div>
            <p className="text-xs text-muted-foreground">{currentReport.period}</p>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
            </CardTitle>
            <div className="text-2xl font-bold">{currentReport.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {currentReport.totalTasks > 0 ? ((currentReport.completedTasks / currentReport.totalTasks) * 100).toFixed(1) : 0}% completion rate
            </p>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              In Progress
            </CardTitle>
            <div className="text-2xl font-bold">{currentReport.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">Active repairs</p>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue
            </CardTitle>
            <div className="text-2xl font-bold">{currentReport.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </CardTitle>
            <div className="text-lg font-bold">GHS {currentReport.totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: GHS {currentReport.totalTasks > 0 ? (currentReport.totalCost / currentReport.totalTasks).toFixed(0) : 0}/task
            </p>
          </CardHeader>
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
                        { name: 'Completed', value: currentReport.completedTasks, color: '#10b981' },
                        { name: 'In Progress', value: currentReport.inProgressTasks, color: '#f59e0b' },
                        { name: 'Overdue', value: currentReport.overdueTasks, color: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                    >
                      {[
                        { name: 'Completed', value: currentReport.completedTasks, color: '#10b981' },
                        { name: 'In Progress', value: currentReport.inProgressTasks, color: '#f59e0b' },
                        { name: 'Overdue', value: currentReport.overdueTasks, color: '#ef4444' }
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
                    <Line yAxisId="tasks" type="monotone" dataKey="completionRate" stroke="#f59e0b" name="Completion Rate %" />
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
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="completedTasks" stackId="1" stroke="#10b981" fill="#10b981" />
                    <Area type="monotone" dataKey="inProgressTasks" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                    <Area type="monotone" dataKey="overdueTasks" stackId="1" stroke="#ef4444" fill="#ef4444" />
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
                    <XAxis dataKey="period" />
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
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="totalCost" stroke="#06b6d4" fill="#06b6d4" />
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
                    <Badge className={provider.completionRate >= 90 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
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
                            <span className="font-medium">{provider.completionRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>On-time Delivery:</span>
                            <span className="font-medium">{provider.onTimeDelivery.toFixed(1)}%</span>
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
                            <span className="font-medium">{provider.avgRepairTime.toFixed(1)} days</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Cost:</span>
                            <span className="font-medium">GHS {provider.totalCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Avg Cost per Task:</span>
                            <span className="font-medium">GHS {(provider.totalCost / provider.tasksCompleted).toFixed(0)}</span>
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
                              <Badge size="sm" className={
                                task.status === "completed" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"
                              }>
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
                    <Pie
                      data={currentReport.deviceTypes}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="count"
                    >
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
                        <span>{device.avgRepairTime.toFixed(1)} days</span>
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
                        Total Impact: GHS {(issue.frequency * issue.avgCost).toLocaleString()}
                      </p>
                      <Badge variant="outline">
                        {((issue.frequency / currentReport.totalTasks) * 100).toFixed(1)}% of all issues
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