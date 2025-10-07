"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  RadialBarChart, 
  RadialBar, 
  ResponsiveContainer,
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
  Cell
} from "recharts"
import { 
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  CheckCircle,
  Users,
  Wrench,
  BookOpen,
  Star,
  AlertCircle,
  Calendar,
  BarChart3,
  Trophy,
  Activity
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface PerformanceMetric {
  id: string
  category: "financial" | "customer" | "internal" | "learning"
  name: string
  current: number
  target: number
  unit: string
  trend: "up" | "down" | "stable"
  weight: number
  description: string
}

interface TaskPerformance {
  id: string
  title: string
  status: "completed" | "in_progress" | "overdue" | "pending"
  dueDate: string
  completedDate?: string
  priority: "high" | "medium" | "low"
  timeSpent: number
  estimatedTime: number
  qualityScore: number
  complexity: number
}

interface StaffScore {
  overall: number
  financial: number
  customer: number
  internal: number
  learning: number
}

interface GoalProgress {
  id: string
  title: string
  category: string
  progress: number
  target: number
  deadline: string
  status: "on_track" | "at_risk" | "behind"
}

export function StaffPerformanceDashboard() {
  const { user } = useAuth()
  const [timeframe, setTimeframe] = useState("month")
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
  const [taskPerformance, setTaskPerformance] = useState<TaskPerformance[]>([])
  const [staffScore, setStaffScore] = useState<StaffScore>({
    overall: 0,
    financial: 0,
    customer: 0,
    internal: 0,
    learning: 0
  })
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([])

  useEffect(() => {
    // Mock performance data based on balanced scorecard
    const mockMetrics: PerformanceMetric[] = [
      // Financial Perspective
      {
        id: "cost-efficiency",
        category: "financial",
        name: "Cost Efficiency",
        current: 92,
        target: 95,
        unit: "%",
        trend: "up",
        weight: 25,
        description: "Cost savings and resource optimization"
      },
      {
        id: "budget-compliance",
        category: "financial",
        name: "Budget Compliance",
        current: 88,
        target: 90,
        unit: "%",
        trend: "stable",
        weight: 15,
        description: "Adherence to project budgets"
      },
      
      // Customer Perspective
      {
        id: "satisfaction",
        category: "customer",
        name: "User Satisfaction",
        current: 4.6,
        target: 4.5,
        unit: "/5",
        trend: "up",
        weight: 20,
        description: "End-user satisfaction ratings"
      },
      {
        id: "response-time",
        category: "customer",
        name: "Response Time",
        current: 2.1,
        target: 2.0,
        unit: "hrs",
        trend: "down",
        weight: 15,
        description: "Average ticket response time"
      },
      {
        id: "resolution-rate",
        category: "customer",
        name: "First Call Resolution",
        current: 78,
        target: 80,
        unit: "%",
        trend: "up",
        weight: 20,
        description: "Issues resolved on first contact"
      },
      
      // Internal Process Perspective
      {
        id: "task-completion",
        category: "internal",
        name: "Task Completion Rate",
        current: 94,
        target: 95,
        unit: "%",
        trend: "stable",
        weight: 25,
        description: "On-time task completion"
      },
      {
        id: "quality-score",
        category: "internal",
        name: "Work Quality Score",
        current: 87,
        target: 85,
        unit: "%",
        trend: "up",
        weight: 20,
        description: "Quality assessment of completed work"
      },
      {
        id: "collaboration",
        category: "internal",
        name: "Team Collaboration",
        current: 4.3,
        target: 4.0,
        unit: "/5",
        trend: "up",
        weight: 15,
        description: "Cross-team collaboration effectiveness"
      },
      
      // Learning & Growth Perspective
      {
        id: "skills-development",
        category: "learning",
        name: "Skill Development",
        current: 85,
        target: 80,
        unit: "%",
        trend: "up",
        weight: 20,
        description: "Completion of training and certification goals"
      },
      {
        id: "innovation",
        category: "learning",
        name: "Innovation Index",
        current: 72,
        target: 75,
        unit: "%",
        trend: "up",
        weight: 15,
        description: "Process improvements and innovative solutions"
      },
      {
        id: "knowledge-sharing",
        category: "learning",
        name: "Knowledge Sharing",
        current: 68,
        target: 70,
        unit: "%",
        trend: "stable",
        weight: 10,
        description: "Documentation and knowledge transfer activities"
      }
    ]

    const mockTasks: TaskPerformance[] = [
      {
        id: "task-1",
        title: "Server Migration Project",
        status: "completed",
        dueDate: "2025-10-05",
        completedDate: "2025-10-04",
        priority: "high",
        timeSpent: 16,
        estimatedTime: 20,
        qualityScore: 95,
        complexity: 8
      },
      {
        id: "task-2",
        title: "Network Security Audit",
        status: "in_progress",
        dueDate: "2025-10-10",
        priority: "high",
        timeSpent: 12,
        estimatedTime: 24,
        qualityScore: 0,
        complexity: 9
      },
      {
        id: "task-3",
        title: "User Training Sessions",
        status: "completed",
        dueDate: "2025-10-02",
        completedDate: "2025-10-02",
        priority: "medium",
        timeSpent: 8,
        estimatedTime: 8,
        qualityScore: 88,
        complexity: 5
      },
      {
        id: "task-4",
        title: "Software Updates Deployment",
        status: "overdue",
        dueDate: "2025-10-01",
        priority: "medium",
        timeSpent: 4,
        estimatedTime: 6,
        qualityScore: 0,
        complexity: 4
      }
    ]

    const mockGoals: GoalProgress[] = [
      {
        id: "goal-1",
        title: "Complete Cloud Certification",
        category: "Learning & Development",
        progress: 75,
        target: 100,
        deadline: "2025-12-31",
        status: "on_track"
      },
      {
        id: "goal-2",
        title: "Reduce Average Response Time",
        category: "Customer Service",
        progress: 60,
        target: 100,
        deadline: "2025-11-30",
        status: "at_risk"
      },
      {
        id: "goal-3",
        title: "Implement Process Improvements",
        category: "Internal Process",
        progress: 40,
        target: 100,
        deadline: "2025-10-31",
        status: "behind"
      }
    ]

    setPerformanceMetrics(mockMetrics)
    setTaskPerformance(mockTasks)
    setGoalProgress(mockGoals)

    // Calculate balanced scorecard scores
    const calculateCategoryScore = (category: string) => {
      const categoryMetrics = mockMetrics.filter(m => m.category === category)
      const weightedScore = categoryMetrics.reduce((sum, metric) => {
        const achievementRate = (metric.current / metric.target) * 100
        const cappedRate = Math.min(achievementRate, 120) // Cap at 120%
        return sum + (cappedRate * metric.weight / 100)
      }, 0)
      const totalWeight = categoryMetrics.reduce((sum, metric) => sum + metric.weight, 0)
      return Math.round(weightedScore / totalWeight * 100)
    }

    const financial = calculateCategoryScore("financial")
    const customer = calculateCategoryScore("customer")
    const internal = calculateCategoryScore("internal")
    const learning = calculateCategoryScore("learning")
    const overall = Math.round((financial + customer + internal + learning) / 4)

    setStaffScore({ overall, financial, customer, internal, learning })
  }, [timeframe])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "financial": return <Target className="h-5 w-5" />
      case "customer": return <Users className="h-5 w-5" />
      case "internal": return <Wrench className="h-5 w-5" />
      case "learning": return <BookOpen className="h-5 w-5" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-100 border-green-200"
    if (score >= 80) return "bg-blue-100 border-blue-200"
    if (score >= 70) return "bg-yellow-100 border-yellow-200"
    return "bg-red-100 border-red-200"
  }

  const balancedScorecardData = [
    { name: "Financial", score: staffScore.financial, color: "#10B981", category: "financial" },
    { name: "Customer", score: staffScore.customer, color: "#3B82F6", category: "customer" },
    { name: "Internal", score: staffScore.internal, color: "#F59E0B", category: "internal" },
    { name: "Learning", score: staffScore.learning, color: "#8B5CF6", category: "learning" }
  ]

  const taskStatusData = [
    { name: "Completed", value: taskPerformance.filter(t => t.status === "completed").length, color: "#10B981" },
    { name: "In Progress", value: taskPerformance.filter(t => t.status === "in_progress").length, color: "#3B82F6" },
    { name: "Overdue", value: taskPerformance.filter(t => t.status === "overdue").length, color: "#EF4444" },
    { name: "Pending", value: taskPerformance.filter(t => t.status === "pending").length, color: "#6B7280" }
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Performance Dashboard</h1>
          <p className="text-muted-foreground">Balanced Scorecard Performance Metrics</p>
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
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className={`${getScoreBgColor(staffScore.overall)} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-full shadow-md">
                <Trophy className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Overall Performance Score</h3>
                <p className="text-muted-foreground">Balanced Scorecard Rating</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(staffScore.overall)}`}>
                {staffScore.overall}%
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {staffScore.overall >= 85 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Excellent Performance
                  </>
                ) : staffScore.overall >= 75 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    Good Performance
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    Needs Improvement
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="scorecard" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="scorecard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Balanced Scorecard
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Task Performance
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Goal Progress
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Development Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scorecard" className="space-y-6">
          {/* Balanced Scorecard Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Balanced Scorecard Overview</CardTitle>
                <CardDescription>Performance across all four perspectives</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={balancedScorecardData}>
                    <RadialBar dataKey="score" cornerRadius={10} fill="#8884d8" />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {balancedScorecardData.map((category) => (
                <Card key={category.name} className="border-l-4" style={{ borderLeftColor: category.color }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(category.category)}
                        <div>
                          <h4 className="font-semibold">{category.name}</h4>
                          <p className="text-sm text-muted-foreground">Perspective</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(category.score)}`}>
                          {category.score}%
                        </div>
                        <Progress value={category.score} className="w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceMetrics.map((metric) => (
              <Card key={metric.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="capitalize">
                      {metric.category.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {metric.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : metric.trend === "down" ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                  </div>
                  
                  <h4 className="font-semibold mb-1">{metric.name}</h4>
                  <p className="text-xs text-muted-foreground mb-3">{metric.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Current</span>
                      <span className="font-medium">{metric.current}{metric.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Target</span>
                      <span className="font-medium">{metric.target}{metric.unit}</span>
                    </div>
                    <Progress 
                      value={(metric.current / metric.target) * 100} 
                      className="h-2"
                    />
                    <div className="text-xs text-center">
                      Achievement: {Math.round((metric.current / metric.target) * 100)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Current task completion overview</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {taskStatusData.map((entry, index) => (
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
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key task performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Completion Rate</span>
                  </div>
                  <span className="font-bold text-green-600">
                    {Math.round((taskPerformance.filter(t => t.status === "completed").length / taskPerformance.length) * 100)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span>Avg Quality Score</span>
                  </div>
                  <span className="font-bold text-blue-600">
                    {Math.round(taskPerformance.filter(t => t.qualityScore > 0).reduce((sum, t) => sum + t.qualityScore, 0) / taskPerformance.filter(t => t.qualityScore > 0).length)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    <span>Time Efficiency</span>
                  </div>
                  <span className="font-bold text-yellow-600">
                    {Math.round((taskPerformance.reduce((sum, t) => sum + t.estimatedTime, 0) / taskPerformance.reduce((sum, t) => sum + Math.max(t.timeSpent, t.estimatedTime), 0)) * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Detailed view of your recent task performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {taskPerformance.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        task.status === "completed" ? "bg-green-500" :
                        task.status === "in_progress" ? "bg-blue-500" :
                        task.status === "overdue" ? "bg-red-500" : "bg-gray-500"
                      }`} />
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Due: {task.dueDate}</span>
                          <Badge variant="outline" className={`${
                            task.priority === "high" ? "border-red-200 text-red-700" :
                            task.priority === "medium" ? "border-yellow-200 text-yellow-700" :
                            "border-green-200 text-green-700"
                          }`}>
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {task.qualityScore > 0 && (
                        <div className="text-lg font-semibold">{task.qualityScore}%</div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        {task.timeSpent}h / {task.estimatedTime}h
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="grid gap-4">
            {goalProgress.map((goal) => (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground">{goal.category}</p>
                    </div>
                    <Badge variant={
                      goal.status === "on_track" ? "default" :
                      goal.status === "at_risk" ? "secondary" : "destructive"
                    }>
                      {goal.status.replace("_", " ")}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{goal.progress}% of {goal.target}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Deadline: {goal.deadline}</span>
                      <span>{goal.target - goal.progress}% remaining</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="development" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Development Plan</CardTitle>
              <CardDescription>Skills and competency development roadmap</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Recommended Training</h4>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between">
                        <span>Cloud Architecture Certification</span>
                        <Badge variant="outline">Priority: High</Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between">
                        <span>Agile Project Management</span>
                        <Badge variant="outline">Priority: Medium</Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex justify-between">
                        <span>Leadership Skills Workshop</span>
                        <Badge variant="outline">Priority: Low</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Skill Assessment</h4>
                  <div className="space-y-3">
                    {[
                      { skill: "Technical Expertise", level: 85 },
                      { skill: "Problem Solving", level: 92 },
                      { skill: "Communication", level: 78 },
                      { skill: "Leadership", level: 65 },
                      { skill: "Innovation", level: 72 }
                    ].map((skill) => (
                      <div key={skill.skill}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{skill.skill}</span>
                          <span className="text-sm font-medium">{skill.level}%</span>
                        </div>
                        <Progress value={skill.level} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
