"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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
  Radar
} from "recharts"
import { 
  Users,
  Award,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Download,
  Filter,
  Building2,
  Calendar,
  Activity
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface StaffMember {
  id: string
  name: string
  email: string
  location: string
  avatar?: string
  role: string
  joinDate: string
  
  // Performance Metrics
  totalTasksAssigned: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  averageCompletionTime: number // hours
  taskCompletionRate: number // percentage
  qualityScore: number // 1-5 rating
  customerSatisfactionScore: number // 1-5 rating
  
  // Skills & Specializations
  specializations: string[]
  certifications: string[]
  skillLevel: "junior" | "intermediate" | "senior" | "expert"
  
  // Time & Productivity
  hoursLogged: number
  productivityScore: number // percentage
  attendanceRate: number // percentage
  
  // Monthly Performance
  monthlyPerformance: {
    month: string
    tasksCompleted: number
    avgRating: number
    hoursWorked: number
  }[]
  
  // Recent Activity
  recentTasks: {
    taskId: string
    title: string
    completedDate: string
    rating: number
  }[]
}

interface TeamMetrics {
  totalStaff: number
  avgPerformanceScore: number
  totalTasksCompleted: number
  avgCompletionTime: number
  teamSatisfactionScore: number
  topPerformers: string[]
  needsImprovement: string[]
}

export function StaffPerformanceReport() {
  const { user } = useAuth()
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics | null>(null)
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedTimeframe, setSelectedTimeframe] = useState("30")
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    const mockStaffMembers: StaffMember[] = [
      {
        id: "staff-001",
        name: "Kwame Asante",
        email: "kwame.asante@qcc.com.gh",
        location: "Kumasi Branch",
        role: "IT Staff",
        joinDate: "2023-03-15",
        totalTasksAssigned: 48,
        completedTasks: 42,
        inProgressTasks: 4,
        overdueTasks: 2,
        averageCompletionTime: 4.2,
        taskCompletionRate: 87.5,
        qualityScore: 4.6,
        customerSatisfactionScore: 4.7,
        specializations: ["Hardware Repair", "Network Setup", "Printer Maintenance"],
        certifications: ["CompTIA A+", "Network+"],
        skillLevel: "intermediate",
        hoursLogged: 168,
        productivityScore: 92,
        attendanceRate: 96,
        monthlyPerformance: [
          { month: "Nov 2024", tasksCompleted: 18, avgRating: 4.5, hoursWorked: 42 },
          { month: "Dec 2024", tasksCompleted: 20, avgRating: 4.6, hoursWorked: 45 },
          { month: "Jan 2025", tasksCompleted: 22, avgRating: 4.7, hoursWorked: 44 }
        ],
        recentTasks: [
          { taskId: "TSK-001", title: "Laptop Screen Repair", completedDate: "2025-01-10", rating: 5 },
          { taskId: "TSK-002", title: "Network Configuration", completedDate: "2025-01-08", rating: 4 }
        ]
      },
      {
        id: "staff-002",
        name: "Ama Osei",
        email: "ama.osei@qcc.com.gh", 
        location: "Kumasi Branch",
        role: "IT Staff",
        joinDate: "2023-08-20",
        totalTasksAssigned: 55,
        completedTasks: 51,
        inProgressTasks: 3,
        overdueTasks: 1,
        averageCompletionTime: 3.8,
        taskCompletionRate: 92.7,
        qualityScore: 4.8,
        customerSatisfactionScore: 4.9,
        specializations: ["Software Support", "User Training", "Email Systems"],
        certifications: ["Microsoft Office Specialist", "Google Workspace"],
        skillLevel: "senior",
        hoursLogged: 175,
        productivityScore: 96,
        attendanceRate: 98,
        monthlyPerformance: [
          { month: "Nov 2024", tasksCompleted: 22, avgRating: 4.7, hoursWorked: 44 },
          { month: "Dec 2024", tasksCompleted: 25, avgRating: 4.8, hoursWorked: 46 },
          { month: "Jan 2025", tasksCompleted: 24, avgRating: 4.9, hoursWorked: 45 }
        ],
        recentTasks: [
          { taskId: "TSK-003", title: "Email Setup", completedDate: "2025-01-12", rating: 5 },
          { taskId: "TSK-004", title: "User Training Session", completedDate: "2025-01-09", rating: 5 }
        ]
      },
      {
        id: "staff-003",
        name: "Kofi Mensah",
        email: "kofi.mensah@qcc.com.gh",
        location: "Takoradi Branch", 
        role: "IT Staff",
        joinDate: "2023-11-10",
        totalTasksAssigned: 32,
        completedTasks: 26,
        inProgressTasks: 4,
        overdueTasks: 2,
        averageCompletionTime: 6.1,
        taskCompletionRate: 81.3,
        qualityScore: 4.2,
        customerSatisfactionScore: 4.3,
        specializations: ["Basic Repairs", "Printer Maintenance"],
        certifications: ["Basic IT Support"],
        skillLevel: "junior",
        hoursLogged: 152,
        productivityScore: 78,
        attendanceRate: 92,
        monthlyPerformance: [
          { month: "Nov 2024", tasksCompleted: 12, avgRating: 4.0, hoursWorked: 38 },
          { month: "Dec 2024", tasksCompleted: 10, avgRating: 4.2, hoursWorked: 39 },
          { month: "Jan 2025", tasksCompleted: 14, avgRating: 4.3, hoursWorked: 40 }
        ],
        recentTasks: [
          { taskId: "TSK-005", title: "Printer Fix", completedDate: "2025-01-11", rating: 4 },
          { taskId: "TSK-006", title: "Computer Cleanup", completedDate: "2025-01-07", rating: 4 }
        ]
      },
      {
        id: "staff-004",
        name: "Akosua Darko",
        email: "akosua.darko@qcc.com.gh",
        location: "Accra Branch",
        role: "Senior IT Staff", 
        joinDate: "2023-06-05",
        totalTasksAssigned: 72,
        completedTasks: 68,
        inProgressTasks: 3,
        overdueTasks: 1,
        averageCompletionTime: 3.2,
        taskCompletionRate: 94.4,
        qualityScore: 4.9,
        customerSatisfactionScore: 4.8,
        specializations: ["Advanced Diagnostics", "Server Maintenance", "Security Systems"],
        certifications: ["CISSP", "CCNA", "CompTIA Security+"],
        skillLevel: "expert",
        hoursLogged: 182,
        productivityScore: 98,
        attendanceRate: 99,
        monthlyPerformance: [
          { month: "Nov 2024", tasksCompleted: 28, avgRating: 4.8, hoursWorked: 46 },
          { month: "Dec 2024", tasksCompleted: 30, avgRating: 4.9, hoursWorked: 48 },
          { month: "Jan 2025", tasksCompleted: 32, avgRating: 4.8, hoursWorked: 47 }
        ],
        recentTasks: [
          { taskId: "TSK-007", title: "Server Migration", completedDate: "2025-01-13", rating: 5 },
          { taskId: "TSK-008", title: "Security Audit", completedDate: "2025-01-10", rating: 5 }
        ]
      }
    ]

    setStaffMembers(mockStaffMembers)
    
    // Calculate team metrics
    const totalStaff = mockStaffMembers.length
    const avgPerformanceScore = mockStaffMembers.reduce((sum, staff) => sum + staff.productivityScore, 0) / totalStaff
    const totalTasksCompleted = mockStaffMembers.reduce((sum, staff) => sum + staff.completedTasks, 0)
    const avgCompletionTime = mockStaffMembers.reduce((sum, staff) => sum + staff.averageCompletionTime, 0) / totalStaff
    const teamSatisfactionScore = mockStaffMembers.reduce((sum, staff) => sum + staff.customerSatisfactionScore, 0) / totalStaff

    const sortedByPerformance = [...mockStaffMembers].sort((a, b) => b.productivityScore - a.productivityScore)
    const topPerformers = sortedByPerformance.slice(0, 2).map(staff => staff.name)
    const needsImprovement = sortedByPerformance.slice(-2).map(staff => staff.name)

    setTeamMetrics({
      totalStaff,
      avgPerformanceScore,
      totalTasksCompleted,
      avgCompletionTime,
      teamSatisfactionScore,
      topPerformers,
      needsImprovement
    })
  }, [])

  const generatePerformanceReport = async () => {
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsGenerating(false)
    
    const reportData = {
      generatedBy: user?.name,
      generatedAt: new Date().toISOString(),
      timeframe: selectedTimeframe,
      location: selectedLocation,
      teamMetrics,
      staffData: filteredStaff
    }
    
    console.log("Performance Report Generated:", reportData)
    alert("Staff Performance Report generated successfully!")
  }

  const filteredStaff = selectedLocation === "all" 
    ? staffMembers 
    : staffMembers.filter(staff => staff.location === selectedLocation)

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case "expert": return "bg-purple-100 text-purple-800 border-purple-200"
      case "senior": return "bg-green-100 text-green-800 border-green-200"
      case "intermediate": return "bg-blue-100 text-blue-800 border-blue-200"
      case "junior": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 95) return "text-green-600"
    if (score >= 85) return "text-blue-600"
    if (score >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  // Prepare radar chart data for selected staff member
  const selectedStaffData = selectedStaff ? staffMembers.find(s => s.id === selectedStaff) : null
  const radarData = selectedStaffData ? [
    { subject: "Quality", score: selectedStaffData.qualityScore * 20, fullMark: 100 },
    { subject: "Productivity", score: selectedStaffData.productivityScore, fullMark: 100 },
    { subject: "Satisfaction", score: selectedStaffData.customerSatisfactionScore * 20, fullMark: 100 },
    { subject: "Completion Rate", score: selectedStaffData.taskCompletionRate, fullMark: 100 },
    { subject: "Attendance", score: selectedStaffData.attendanceRate, fullMark: 100 },
    { subject: "Skill Level", score: selectedStaffData.skillLevel === "expert" ? 100 : selectedStaffData.skillLevel === "senior" ? 80 : selectedStaffData.skillLevel === "intermediate" ? 60 : 40, fullMark: 100 }
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-yellow-600 flex items-center justify-center shadow-lg">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Staff Performance Report</h1>
            <p className="text-muted-foreground">
              Comprehensive performance analysis and team productivity metrics • QCC Regional Management
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            onClick={generatePerformanceReport}
            disabled={isGenerating}
            className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-white"
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
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Quality Control Company Ltd.
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Kumasi Branch">Kumasi Branch</SelectItem>
                  <SelectItem value="Accra Branch">Accra Branch</SelectItem>
                  <SelectItem value="Takoradi Branch">Takoradi Branch</SelectItem>
                  <SelectItem value="Cape Coast Branch">Cape Coast Branch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Timeframe</Label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="180">Last 6 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Staff Member</Label>
              <Select value={selectedStaff || ""} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff for detailed view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Staff</SelectItem>
                  {filteredStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Overview Stats */}
      {teamMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Staff
              </CardTitle>
              <div className="text-2xl font-bold">{teamMetrics.totalStaff}</div>
            </CardHeader>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Avg Performance
              </CardTitle>
              <div className="text-2xl font-bold">{teamMetrics.avgPerformanceScore.toFixed(1)}%</div>
            </CardHeader>
          </Card>
          
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Tasks Completed
              </CardTitle>
              <div className="text-2xl font-bold">{teamMetrics.totalTasksCompleted}</div>
            </CardHeader>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Completion Time
              </CardTitle>
              <div className="text-2xl font-bold">{teamMetrics.avgCompletionTime.toFixed(1)}h</div>
            </CardHeader>
          </Card>
          
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4" />
                Team Satisfaction
              </CardTitle>
              <div className="text-2xl font-bold">{teamMetrics.teamSatisfactionScore.toFixed(1)}/5</div>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Performance Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Staff Performance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Performance Comparison</CardTitle>
            <CardDescription>Productivity scores and task completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredStaff}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="productivityScore" fill="#10b981" name="Productivity %" />
                <Bar dataKey="taskCompletionRate" fill="#3b82f6" name="Completion Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Individual Staff Radar Chart */}
        {selectedStaffData && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedStaffData.name} - Performance Profile</CardTitle>
              <CardDescription>Comprehensive skill and performance analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name={selectedStaffData.name}
                    dataKey="score"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
        
        {/* Monthly Performance Trend */}
        {!selectedStaff && (
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Trend</CardTitle>
              <CardDescription>Monthly task completion and satisfaction trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={staffMembers[0]?.monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tasksCompleted" stroke="#3b82f6" name="Tasks Completed" strokeWidth={2} />
                  <Line type="monotone" dataKey="avgRating" stroke="#10b981" name="Avg Rating" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Staff Performance Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredStaff.map((staff) => (
          <Card key={staff.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={staff.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-green-500 to-yellow-500 text-white font-semibold">
                      {staff.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{staff.name}</CardTitle>
                    <CardDescription>
                      {staff.email} • {staff.location}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getSkillLevelColor(staff.skillLevel)}>
                        {staff.skillLevel}
                      </Badge>
                      <span className={cn("text-sm font-semibold", getPerformanceColor(staff.productivityScore))}>
                        {staff.productivityScore}% productivity
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Task Statistics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">{staff.completedTasks}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-600">{staff.inProgressTasks}</div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-red-600">{staff.overdueTasks}</div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
              </div>
              
              {/* Performance Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Task Completion Rate</span>
                  <span className="font-medium">{staff.taskCompletionRate}%</span>
                </div>
                <Progress value={staff.taskCompletionRate} className="h-2" />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Avg Completion Time
                    </div>
                    <div className="font-medium">{staff.averageCompletionTime}h</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Star className="h-3 w-3" />
                      Customer Rating
                    </div>
                    <div className="font-medium">{staff.customerSatisfactionScore}/5</div>
                  </div>
                </div>
              </div>
              
              {/* Specializations */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Specializations</div>
                <div className="flex gap-2 flex-wrap">
                  {staff.specializations.slice(0, 3).map((spec, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                  {staff.specializations.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{staff.specializations.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Recent Tasks */}
              {staff.recentTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Recent Tasks</div>
                  <div className="space-y-1">
                    {staff.recentTasks.slice(0, 2).map((task, index) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="truncate">{task.title}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{task.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
