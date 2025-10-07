"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  Cell,
  PieChart,
  Pie
} from "recharts"
import { 
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Search,
  Filter,
  Download,
  Eye,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BarChart3,
  Activity,
  Shield,
  Settings
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  department: string
  location: string
  supervisor: string
  hireDate: string
  overallScore: number
  financialScore: number
  customerScore: number
  internalScore: number
  learningScore: number
  tasksCompleted: number
  tasksTotal: number
  avgQualityScore: number
  responseTime: number
  satisfactionRating: number
  status: "excellent" | "good" | "average" | "needs_improvement"
  lastEvaluation: string
}

interface TeamMetrics {
  totalStaff: number
  avgPerformance: number
  topPerformers: number
  needsAttention: number
  completionRate: number
  satisfactionScore: number
}

interface RegionalPerformance {
  region: string
  staffCount: number
  avgScore: number
  itHead: string
  performance: "excellent" | "good" | "average" | "poor"
}

export function ITHeadPerformanceManagement() {
  const { user } = useAuth()
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics>({
    totalStaff: 0,
    avgPerformance: 0,
    topPerformers: 0,
    needsAttention: 0,
    completionRate: 0,
    satisfactionScore: 0
  })
  const [regionalPerformance, setRegionalPerformance] = useState<RegionalPerformance[]>([])
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [sortBy, setSortBy] = useState("overallScore")
  const [timeframe, setTimeframe] = useState("month")

  // Role-based access control
  if (!user || !["it_head", "admin"].includes(user.role)) {
    return (
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
              You don't have permission to view staff performance data. This feature is only available to IT Heads and System Administrators.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  useEffect(() => {
    // Mock staff performance data
    const mockStaffData: StaffMember[] = [
      {
        id: "staff-001",
        name: "John Doe",
        email: "john.doe@qcc.com.gh",
        role: "IT Staff",
        department: "Technical Support",
        location: "Head Office",
        supervisor: "IT Head",
        hireDate: "2023-01-15",
        overallScore: 92,
        financialScore: 88,
        customerScore: 95,
        internalScore: 90,
        learningScore: 94,
        tasksCompleted: 47,
        tasksTotal: 50,
        avgQualityScore: 93,
        responseTime: 1.8,
        satisfactionRating: 4.7,
        status: "excellent",
        lastEvaluation: "2025-09-30"
      },
      {
        id: "staff-002",
        name: "Jane Smith",
        email: "jane.smith@qcc.com.gh",
        role: "IT Staff",
        department: "Infrastructure",
        location: "Kumasi Branch",
        supervisor: "Regional IT Head",
        hireDate: "2022-06-20",
        overallScore: 85,
        financialScore: 82,
        customerScore: 88,
        internalScore: 87,
        learningScore: 83,
        tasksCompleted: 42,
        tasksTotal: 48,
        avgQualityScore: 87,
        responseTime: 2.3,
        satisfactionRating: 4.4,
        status: "good",
        lastEvaluation: "2025-09-28"
      },
      {
        id: "staff-003",
        name: "Michael Johnson",
        email: "michael.johnson@qcc.com.gh",
        role: "Service Desk Staff",
        department: "Service Desk",
        location: "Accra Branch",
        supervisor: "Service Desk Head",
        hireDate: "2024-02-10",
        overallScore: 78,
        financialScore: 75,
        customerScore: 82,
        internalScore: 76,
        learningScore: 79,
        tasksCompleted: 35,
        tasksTotal: 45,
        avgQualityScore: 81,
        responseTime: 2.8,
        satisfactionRating: 4.1,
        status: "average",
        lastEvaluation: "2025-09-25"
      },
      {
        id: "staff-004",
        name: "Sarah Williams",
        email: "sarah.williams@qcc.com.gh",
        role: "Regional IT Head",
        department: "Regional Management",
        location: "Cape Coast",
        supervisor: "IT Head",
        hireDate: "2021-03-12",
        overallScore: 89,
        financialScore: 91,
        customerScore: 86,
        internalScore: 92,
        learningScore: 87,
        tasksCompleted: 38,
        tasksTotal: 40,
        avgQualityScore: 91,
        responseTime: 1.5,
        satisfactionRating: 4.6,
        status: "excellent",
        lastEvaluation: "2025-09-30"
      },
      {
        id: "staff-005",
        name: "David Brown",
        email: "david.brown@qcc.com.gh",
        role: "IT Staff",
        department: "Network Security",
        location: "Head Office",
        supervisor: "IT Head",
        hireDate: "2023-09-05",
        overallScore: 68,
        financialScore: 65,
        customerScore: 70,
        internalScore: 72,
        learningScore: 65,
        tasksCompleted: 28,
        tasksTotal: 42,
        avgQualityScore: 72,
        responseTime: 3.2,
        satisfactionRating: 3.8,
        status: "needs_improvement",
        lastEvaluation: "2025-09-20"
      }
    ]

    const mockRegionalData: RegionalPerformance[] = [
      {
        region: "Greater Accra",
        staffCount: 15,
        avgScore: 86,
        itHead: "James Anderson",
        performance: "excellent"
      },
      {
        region: "Ashanti (Kumasi)",
        staffCount: 12,
        avgScore: 82,
        itHead: "Mary Osei",
        performance: "good"
      },
      {
        region: "Central (Cape Coast)",
        staffCount: 8,
        avgScore: 79,
        itHead: "Sarah Williams",
        performance: "good"
      },
      {
        region: "Northern (Tamale)",
        staffCount: 6,
        avgScore: 74,
        itHead: "Ibrahim Mohammed",
        performance: "average"
      }
    ]

    // Filter data based on selections
    let filteredStaff = mockStaffData
    if (selectedLocation !== "all") {
      filteredStaff = filteredStaff.filter(staff => staff.location === selectedLocation)
    }
    if (selectedDepartment !== "all") {
      filteredStaff = filteredStaff.filter(staff => staff.department === selectedDepartment)
    }
    if (searchQuery) {
      filteredStaff = filteredStaff.filter(staff => 
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort data
    filteredStaff.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "overallScore":
          return b.overallScore - a.overallScore
        case "tasksCompleted":
          return b.tasksCompleted - a.tasksCompleted
        case "satisfactionRating":
          return b.satisfactionRating - a.satisfactionRating
        default:
          return b.overallScore - a.overallScore
      }
    })

    setStaffMembers(filteredStaff)
    setRegionalPerformance(mockRegionalData)

    // Calculate team metrics
    const metrics: TeamMetrics = {
      totalStaff: filteredStaff.length,
      avgPerformance: Math.round(filteredStaff.reduce((sum, staff) => sum + staff.overallScore, 0) / filteredStaff.length),
      topPerformers: filteredStaff.filter(staff => staff.status === "excellent").length,
      needsAttention: filteredStaff.filter(staff => staff.status === "needs_improvement").length,
      completionRate: Math.round((filteredStaff.reduce((sum, staff) => sum + staff.tasksCompleted, 0) / filteredStaff.reduce((sum, staff) => sum + staff.tasksTotal, 0)) * 100),
      satisfactionScore: Math.round((filteredStaff.reduce((sum, staff) => sum + staff.satisfactionRating, 0) / filteredStaff.length) * 10) / 10
    }
    setTeamMetrics(metrics)
  }, [selectedLocation, selectedDepartment, searchQuery, sortBy, timeframe])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-600 bg-green-100"
      case "good": return "text-blue-600 bg-blue-100"
      case "average": return "text-yellow-600 bg-yellow-100"
      case "needs_improvement": return "text-red-600 bg-red-100"
      default: return "text-gray-600 bg-gray-100"
    }
  }

  const getPerformanceIcon = (score: number) => {
    if (score >= 90) return <Award className="h-4 w-4 text-green-600" />
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-blue-600" />
    if (score >= 70) return <Clock className="h-4 w-4 text-yellow-600" />
    return <AlertTriangle className="h-4 w-4 text-red-600" />
  }

  const performanceDistributionData = [
    { name: "Excellent (90+)", value: staffMembers.filter(s => s.overallScore >= 90).length, color: "#10B981" },
    { name: "Good (80-89)", value: staffMembers.filter(s => s.overallScore >= 80 && s.overallScore < 90).length, color: "#3B82F6" },
    { name: "Average (70-79)", value: staffMembers.filter(s => s.overallScore >= 70 && s.overallScore < 80).length, color: "#F59E0B" },
    { name: "Needs Improvement (<70)", value: staffMembers.filter(s => s.overallScore < 70).length, color: "#EF4444" }
  ]

  const departmentPerformanceData = Array.from(new Set(staffMembers.map(s => s.department)))
    .map(dept => ({
      department: dept,
      avgScore: Math.round(staffMembers.filter(s => s.department === dept).reduce((sum, s) => sum + s.overallScore, 0) / staffMembers.filter(s => s.department === dept).length),
      staffCount: staffMembers.filter(s => s.department === dept).length
    }))

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Performance Management</h1>
          <p className="text-muted-foreground">Balanced Scorecard Performance Overview</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{teamMetrics.totalStaff}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Performance</p>
                <p className="text-2xl font-bold">{teamMetrics.avgPerformance}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Top Performers</p>
                <p className="text-2xl font-bold">{teamMetrics.topPerformers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Needs Attention</p>
                <p className="text-2xl font-bold">{teamMetrics.needsAttention}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Task Completion</p>
                <p className="text-2xl font-bold">{teamMetrics.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold">{teamMetrics.satisfactionScore}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="individual">Individual Performance</TabsTrigger>
          <TabsTrigger value="regional">Regional Performance</TabsTrigger>
          <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Distribution</CardTitle>
                <CardDescription>Staff performance rating distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {performanceDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Average scores by department</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgScore" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Head Office">Head Office</SelectItem>
                <SelectItem value="Kumasi Branch">Kumasi Branch</SelectItem>
                <SelectItem value="Accra Branch">Accra Branch</SelectItem>
                <SelectItem value="Cape Coast">Cape Coast</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Technical Support">Technical Support</SelectItem>
                <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                <SelectItem value="Service Desk">Service Desk</SelectItem>
                <SelectItem value="Network Security">Network Security</SelectItem>
                <SelectItem value="Regional Management">Regional Management</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overallScore">Overall Score</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="tasksCompleted">Tasks Completed</SelectItem>
                <SelectItem value="satisfactionRating">Satisfaction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Staff Performance Grid */}
          <div className="grid gap-4">
            {staffMembers.map((staff) => (
              <Card key={staff.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getPerformanceIcon(staff.overallScore)}
                        <div>
                          <h4 className="font-semibold text-lg">{staff.name}</h4>
                          <p className="text-sm text-muted-foreground">{staff.role} - {staff.department}</p>
                          <p className="text-xs text-muted-foreground">{staff.location}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{staff.overallScore}%</div>
                        <Badge className={`text-xs ${getStatusColor(staff.status)}`}>
                          {staff.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-sm font-medium">{staff.financialScore}%</div>
                          <div className="text-xs text-muted-foreground">Financial</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{staff.customerScore}%</div>
                          <div className="text-xs text-muted-foreground">Customer</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{staff.internalScore}%</div>
                          <div className="text-xs text-muted-foreground">Internal</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{staff.learningScore}%</div>
                          <div className="text-xs text-muted-foreground">Learning</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm">{staff.tasksCompleted}/{staff.tasksTotal} tasks</div>
                        <div className="text-sm">{staff.satisfactionRating}/5 rating</div>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedStaff(staff)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{staff.name} - Detailed Performance</DialogTitle>
                            <DialogDescription>
                              Comprehensive performance analysis and metrics
                            </DialogDescription>
                          </DialogHeader>
                          {selectedStaff && (
                            <div className="space-y-6">
                              {/* Balanced Scorecard Radar Chart */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Balanced Scorecard</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <ResponsiveContainer width="100%" height={250}>
                                      <RadarChart data={[
                                        { subject: 'Financial', score: selectedStaff.financialScore, fullMark: 100 },
                                        { subject: 'Customer', score: selectedStaff.customerScore, fullMark: 100 },
                                        { subject: 'Internal', score: selectedStaff.internalScore, fullMark: 100 },
                                        { subject: 'Learning', score: selectedStaff.learningScore, fullMark: 100 }
                                      ]}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis angle={0} domain={[0, 100]} />
                                        <Radar dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                                      </RadarChart>
                                    </ResponsiveContainer>
                                  </CardContent>
                                </Card>
                                
                                <div className="space-y-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle>Key Metrics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      <div className="flex justify-between">
                                        <span>Task Completion Rate</span>
                                        <span className="font-medium">
                                          {Math.round((selectedStaff.tasksCompleted / selectedStaff.tasksTotal) * 100)}%
                                        </span>
                                      </div>
                                      <Progress value={(selectedStaff.tasksCompleted / selectedStaff.tasksTotal) * 100} />
                                      
                                      <div className="flex justify-between">
                                        <span>Quality Score</span>
                                        <span className="font-medium">{selectedStaff.avgQualityScore}%</span>
                                      </div>
                                      <Progress value={selectedStaff.avgQualityScore} />
                                      
                                      <div className="flex justify-between">
                                        <span>Response Time</span>
                                        <span className="font-medium">{selectedStaff.responseTime} hours</span>
                                      </div>
                                      
                                      <div className="flex justify-between">
                                        <span>Satisfaction Rating</span>
                                        <span className="font-medium">{selectedStaff.satisfactionRating}/5</span>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </div>
                              
                              {/* Additional Details */}
                              <Card>
                                <CardHeader>
                                  <CardTitle>Staff Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p><strong>Email:</strong> {selectedStaff.email}</p>
                                      <p><strong>Department:</strong> {selectedStaff.department}</p>
                                      <p><strong>Location:</strong> {selectedStaff.location}</p>
                                    </div>
                                    <div>
                                      <p><strong>Supervisor:</strong> {selectedStaff.supervisor}</p>
                                      <p><strong>Hire Date:</strong> {selectedStaff.hireDate}</p>
                                      <p><strong>Last Evaluation:</strong> {selectedStaff.lastEvaluation}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="regional" className="space-y-6">
          <div className="grid gap-4">
            {regionalPerformance.map((region) => (
              <Card key={region.region} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{region.region}</h4>
                      <p className="text-sm text-muted-foreground">Regional IT Head: {region.itHead}</p>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Staff Count</div>
                        <div className="text-xl font-bold">{region.staffCount}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Avg Performance</div>
                        <div className="text-xl font-bold">{region.avgScore}%</div>
                      </div>
                      
                      <Badge className={`${getStatusColor(region.performance)}`}>
                        {region.performance}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Monthly performance trend analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', avg: 78, target: 80 },
                    { month: 'Feb', avg: 81, target: 80 },
                    { month: 'Mar', avg: 83, target: 80 },
                    { month: 'Apr', avg: 85, target: 80 },
                    { month: 'May', avg: 82, target: 80 },
                    { month: 'Jun', avg: 87, target: 80 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avg" stroke="#3B82F6" name="Average Score" />
                    <Line type="monotone" dataKey="target" stroke="#10B981" strokeDasharray="5 5" name="Target" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance vs Experience</CardTitle>
                <CardDescription>Correlation between tenure and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={staffMembers.map(staff => ({
                    experience: new Date().getFullYear() - new Date(staff.hireDate).getFullYear(),
                    performance: staff.overallScore,
                    name: staff.name
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="experience" name="Experience (years)" />
                    <YAxis dataKey="performance" name="Performance Score" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter dataKey="performance" fill="#3B82F6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}