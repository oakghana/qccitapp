"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Filter,
  Search,
  Download,
  BarChart3,
  UserCheck,
  Activity,
  Target,
  Calendar,
  Building2
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface ITStaffMember {
  id: string
  name: string
  email: string
  location: string
  avatar?: string
  joinDate: string
  totalTasksAssigned: number
  completedTasks: number
  inProgressTasks: number
  pendingTasks: number
  averageCompletionTime: number // in hours
  performanceScore: number // 0-100
  currentWorkload: "low" | "medium" | "high" | "overloaded"
  lastActivity: string
  specializations: string[]
  monthlyStats: {
    month: string
    tasksCompleted: number
    averageRating: number
  }[]
}

interface TaskSummary {
  id: string
  title: string
  type: "repair" | "service_desk"
  priority: "low" | "medium" | "high" | "critical"
  status: "assigned" | "in_progress" | "completed" | "on_hold"
  assignedTo: string
  dueDate: string
  progress: number
}

export function ITStaffWorkStatus() {
  const { user } = useAuth()
  const [staffMembers, setStaffMembers] = useState<ITStaffMember[]>([])
  const [recentTasks, setRecentTasks] = useState<TaskSummary[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [workloadFilter, setWorkloadFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [timeRange, setTimeRange] = useState("30") // days

  useEffect(() => {
    const mockStaffMembers: ITStaffMember[] = [
      {
        id: "staff-001",
        name: "Kwame Asante", 
        email: "kwame.asante@qcc.com.gh",
        location: "Kumasi Branch",
        joinDate: "2023-03-15",
        totalTasksAssigned: 45,
        completedTasks: 38,
        inProgressTasks: 5,
        pendingTasks: 2,
        averageCompletionTime: 6.5,
        performanceScore: 92,
        currentWorkload: "medium",
        lastActivity: "2024-01-15T14:30:00Z",
        specializations: ["Hardware Repair", "Network Setup"],
        monthlyStats: [
          { month: "Dec 2023", tasksCompleted: 12, averageRating: 4.8 },
          { month: "Jan 2024", tasksCompleted: 15, averageRating: 4.9 }
        ]
      },
      {
        id: "staff-002", 
        name: "Ama Osei",
        email: "ama.osei@qcc.com.gh",
        location: "Kumasi Branch",
        joinDate: "2023-08-20",
        totalTasksAssigned: 52,
        completedTasks: 46,
        inProgressTasks: 4,
        pendingTasks: 2,
        averageCompletionTime: 4.2,
        performanceScore: 95,
        currentWorkload: "high",
        lastActivity: "2024-01-15T16:45:00Z",
        specializations: ["Software Support", "User Training"],
        monthlyStats: [
          { month: "Dec 2023", tasksCompleted: 18, averageRating: 4.9 },
          { month: "Jan 2024", tasksCompleted: 20, averageRating: 4.8 }
        ]
      },
      {
        id: "staff-003",
        name: "Kofi Mensah",
        email: "kofi.mensah@qcc.com.gh", 
        location: "Takoradi Branch",
        joinDate: "2023-11-10",
        totalTasksAssigned: 28,
        completedTasks: 22,
        inProgressTasks: 4,
        pendingTasks: 2,
        averageCompletionTime: 8.1,
        performanceScore: 78,
        currentWorkload: "medium",
        lastActivity: "2024-01-15T11:20:00Z",
        specializations: ["Printer Maintenance", "Basic Repairs"],
        monthlyStats: [
          { month: "Dec 2023", tasksCompleted: 8, averageRating: 4.2 },
          { month: "Jan 2024", tasksCompleted: 10, averageRating: 4.4 }
        ]
      },
      {
        id: "staff-004",
        name: "Akosua Darko",
        email: "akosua.darko@qcc.com.gh",
        location: "Accra Branch", 
        joinDate: "2023-06-05",
        totalTasksAssigned: 67,
        completedTasks: 58,
        inProgressTasks: 7,
        pendingTasks: 2,
        averageCompletionTime: 5.8,
        performanceScore: 88,
        currentWorkload: "overloaded",
        lastActivity: "2024-01-15T17:10:00Z",
        specializations: ["Advanced Diagnostics", "Server Maintenance"],
        monthlyStats: [
          { month: "Dec 2023", tasksCompleted: 22, averageRating: 4.7 },
          { month: "Jan 2024", tasksCompleted: 25, averageRating: 4.6 }
        ]
      }
    ]

    const mockRecentTasks: TaskSummary[] = [
      {
        id: "TSK-001",
        title: "Laptop Screen Repair",
        type: "repair", 
        priority: "high",
        status: "in_progress",
        assignedTo: "Kwame Asante",
        dueDate: "2024-01-18",
        progress: 65
      },
      {
        id: "TSK-002",
        title: "Email Setup Issue",
        type: "service_desk",
        priority: "medium",
        status: "completed",
        assignedTo: "Ama Osei", 
        dueDate: "2024-01-16",
        progress: 100
      },
      {
        id: "TSK-003", 
        title: "Network Connection Problem",
        type: "service_desk",
        priority: "critical",
        status: "assigned",
        assignedTo: "Akosua Darko",
        dueDate: "2024-01-17",
        progress: 0
      }
    ]

    setStaffMembers(mockStaffMembers)
    setRecentTasks(mockRecentTasks)
  }, [])

  const filteredStaff = staffMembers.filter(staff => {
    let matches = true
    
    if (locationFilter !== "all" && staff.location !== locationFilter) {
      matches = false
    }
    
    if (workloadFilter !== "all" && staff.currentWorkload !== workloadFilter) {
      matches = false
    }
    
    if (searchQuery && !staff.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      matches = false
    }
    
    return matches
  })

  const getWorkloadColor = (workload: string) => {
    switch (workload) {
      case "low": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "high": return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300"
      case "overloaded": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300"
      default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-yellow-600"
    if (score >= 70) return "text-orange-600"
    return "text-red-600"
  }

  const calculateTeamStats = () => {
    const totalStaff = staffMembers.length
    const totalTasks = staffMembers.reduce((sum, staff) => sum + staff.totalTasksAssigned, 0)
    const completedTasks = staffMembers.reduce((sum, staff) => sum + staff.completedTasks, 0)
    const inProgressTasks = staffMembers.reduce((sum, staff) => sum + staff.inProgressTasks, 0)
    const avgPerformance = staffMembers.reduce((sum, staff) => sum + staff.performanceScore, 0) / totalStaff
    
    return {
      totalStaff,
      totalTasks,
      completedTasks,
      inProgressTasks,
      avgPerformance: Math.round(avgPerformance),
      completionRate: Math.round((completedTasks / totalTasks) * 100)
    }
  }

  const teamStats = calculateTeamStats()

  return (
    <div className="space-y-6">
      {/* Header with QCC Branding */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-yellow-600 flex items-center justify-center shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">IT Staff Work Status</h1>
            <p className="text-muted-foreground">
              Monitor and manage IT staff performance across all locations • QCC Regional Overview
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Quality Control Company Ltd.
          </Badge>
        </div>
      </div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Staff
            </CardTitle>
            <div className="text-2xl font-bold">{teamStats.totalStaff}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Tasks
            </CardTitle>
            <div className="text-2xl font-bold">{teamStats.totalTasks}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
            </CardTitle>
            <div className="text-2xl font-bold">{teamStats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">{teamStats.completionRate}% completion rate</p>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              In Progress
            </CardTitle>
            <div className="text-2xl font-bold">{teamStats.inProgressTasks}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Performance
            </CardTitle>
            <div className="text-2xl font-bold">{teamStats.avgPerformance}%</div>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search staff</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search staff by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Kumasi Branch">Kumasi</SelectItem>
                  <SelectItem value="Accra Branch">Accra</SelectItem>
                  <SelectItem value="Takoradi Branch">Takoradi</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={workloadFilter} onValueChange={setWorkloadFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Workload" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workloads</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="overloaded">Overloaded</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Staff Status Grid */}
      <div className="grid gap-6">
        {filteredStaff.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No staff members found</h3>
              <p className="text-muted-foreground">
                No staff members match your current filters.
              </p>
            </CardContent>
          </Card>
        ) : (
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
                        <CardDescription className="text-sm">
                          {staff.email} • {staff.location}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getWorkloadColor(staff.currentWorkload)}>
                            {staff.currentWorkload} workload
                          </Badge>
                          <span className={cn("text-sm font-semibold", getPerformanceColor(staff.performanceScore))}>
                            {staff.performanceScore}% performance
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
                      <div className="text-2xl font-bold text-orange-600">{staff.pendingTasks}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                  </div>
                  
                  {/* Performance Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Task Completion Rate</span>
                      <span className="font-medium">
                        {Math.round((staff.completedTasks / staff.totalTasksAssigned) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(staff.completedTasks / staff.totalTasksAssigned) * 100} 
                      className="h-2"
                    />
                  </div>
                  
                  {/* Key Metrics */}
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
                        <Calendar className="h-3 w-3" />
                        Last Activity
                      </div>
                      <div className="font-medium">
                        {new Date(staff.lastActivity).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Specializations */}
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Specializations</div>
                    <div className="flex gap-2 flex-wrap">
                      {staff.specializations.map((spec, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Recent Task Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Task Activity
            </CardTitle>
            <CardDescription>Latest task assignments and updates across all IT staff</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {task.type.replace("_", " ")}
                      </Badge>
                      <Badge 
                        className={
                          task.priority === "critical" ? "bg-red-100 text-red-800" :
                          task.priority === "high" ? "bg-orange-100 text-orange-800" :
                          task.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"
                        }
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Assigned to {task.assignedTo} • Due: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">{task.progress}%</div>
                      <Progress value={task.progress} className="w-20 h-1" />
                    </div>
                    <Badge 
                      className={
                        task.status === "completed" ? "bg-green-100 text-green-800" :
                        task.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                        task.status === "assigned" ? "bg-purple-100 text-purple-800" :
                        "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}