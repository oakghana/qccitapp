"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { 
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Award,
  Activity,
  CheckCircle,
  AlertTriangle,
  Star,
  Eye,
  RefreshCw,
  Download,
  Filter
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface AssignedMetric {
  id: string
  name: string
  description: string
  category: "financial" | "customer" | "internal" | "learning"
  currentValue: number
  targetValue: number
  unit: string
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
  weight: number
  score: number // Current score out of 100
  trend: "up" | "down" | "stable"
  lastUpdated: string
  nextDue: string
  status: "on_track" | "at_risk" | "behind" | "excellent"
  historicalData: { date: string; value: number; target: number }[]
}

interface TaskScore {
  id: string
  taskName: string
  completedDate: string
  category: "financial" | "customer" | "internal" | "learning"
  baseScore: number
  timeBonus: number
  qualityScore: number
  totalScore: number
  complexity: number
  estimatedTime: number
  actualTime: number
  verificationStatus: "submitted" | "verified" | "rejected" | "needs_revision"
  verifiedBy?: string
  verificationDate?: string
  affectsBSC: boolean // Only affects BSC when verified
}

interface PerformanceScore {
  current: number
  target: number
  financial: number
  customer: number
  internal: number
  learning: number
  yearToDate: number
  projectedYear: number
  rank: string // e.g., "Top 10%"
  improvement: number
}

interface Goal {
  id: string
  title: string
  description: string
  category: string
  targetDate: string
  progress: number
  status: "completed" | "in_progress" | "overdue" | "upcoming"
  milestones: { name: string; completed: boolean; date: string }[]
}

export function RealTimePerformanceDashboard() {
  const { user } = useAuth()
  const [assignedMetrics, setAssignedMetrics] = useState<AssignedMetric[]>([])
  const [recentTasks, setRecentTasks] = useState<TaskScore[]>([])
  const [performanceScore, setPerformanceScore] = useState<PerformanceScore>({
    current: 0,
    target: 100,
    financial: 0,
    customer: 0,
    internal: 0,
    learning: 0,
    yearToDate: 0,
    projectedYear: 0,
    rank: "",
    improvement: 0
  })
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    loadPerformanceData()
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadPerformanceData()
      setLastRefresh(new Date())
    }, 300000)

    return () => clearInterval(interval)
  }, [selectedPeriod])

  const loadPerformanceData = () => {
    // Mock real-time performance data
    const mockAssignedMetrics: AssignedMetric[] = [
      {
        id: "metric-1",
        name: "Ticket Resolution Rate",
        description: "Percentage of tickets resolved within SLA",
        category: "customer",
        currentValue: 94,
        targetValue: 95,
        unit: "%",
        frequency: "weekly",
        weight: 25,
        score: 87,
        trend: "up",
        lastUpdated: "2025-10-07T14:30:00Z",
        nextDue: "2025-10-14",
        status: "at_risk",
        historicalData: [
          { date: "2025-09-01", value: 89, target: 95 },
          { date: "2025-09-08", value: 91, target: 95 },
          { date: "2025-09-15", value: 93, target: 95 },
          { date: "2025-09-22", value: 92, target: 95 },
          { date: "2025-09-29", value: 94, target: 95 },
          { date: "2025-10-06", value: 94, target: 95 }
        ]
      },
      {
        id: "metric-2",
        name: "Cost Per Ticket",
        description: "Average cost to resolve each support ticket",
        category: "financial",
        currentValue: 45,
        targetValue: 50,
        unit: "GHS",
        frequency: "monthly",
        weight: 20,
        score: 92,
        trend: "up",
        lastUpdated: "2025-10-07T12:00:00Z",
        nextDue: "2025-10-31",
        status: "excellent",
        historicalData: [
          { date: "2025-06-01", value: 55, target: 50 },
          { date: "2025-07-01", value: 52, target: 50 },
          { date: "2025-08-01", value: 48, target: 50 },
          { date: "2025-09-01", value: 46, target: 50 },
          { date: "2025-10-01", value: 45, target: 50 }
        ]
      },
      {
        id: "metric-3",
        name: "Process Improvements",
        description: "Number of process improvements implemented",
        category: "internal",
        currentValue: 2,
        targetValue: 3,
        unit: "count",
        frequency: "quarterly",
        weight: 15,
        score: 75,
        trend: "stable",
        lastUpdated: "2025-10-01T00:00:00Z",
        nextDue: "2025-12-31",
        status: "on_track",
        historicalData: [
          { date: "2025-03-31", value: 3, target: 3 },
          { date: "2025-06-30", value: 4, target: 3 },
          { date: "2025-09-30", value: 2, target: 3 }
        ]
      },
      {
        id: "metric-4",
        name: "Training Completion",
        description: "Percentage of required training completed",
        category: "learning",
        currentValue: 85,
        targetValue: 100,
        unit: "%",
        frequency: "quarterly",
        weight: 20,
        score: 82,
        trend: "up",
        lastUpdated: "2025-10-01T00:00:00Z",
        nextDue: "2025-12-31",
        status: "at_risk",
        historicalData: [
          { date: "2025-03-31", value: 60, target: 100 },
          { date: "2025-06-30", value: 75, target: 100 },
          { date: "2025-09-30", value: 85, target: 100 }
        ]
      }
    ]

    const mockRecentTasks: TaskScore[] = [
      {
        id: "task-1",
        taskName: "Server Maintenance",
        completedDate: "2025-10-07",
        category: "internal",
        baseScore: 15,
        timeBonus: 2,
        qualityScore: 8,
        totalScore: 25,
        complexity: 4,
        estimatedTime: 4,
        actualTime: 3.5,
        verificationStatus: "verified",
        verifiedBy: "supervisor_001",
        verificationDate: "2025-10-07T10:00:00Z",
        affectsBSC: true
      },
      {
        id: "task-2",
        taskName: "Password Reset Support",
        completedDate: "2025-10-06",
        category: "customer",
        baseScore: 2,
        timeBonus: 1,
        qualityScore: 2,
        totalScore: 5,
        complexity: 1,
        estimatedTime: 0.5,
        actualTime: 0.3,
        verificationStatus: "verified",
        verifiedBy: "supervisor_001",
        verificationDate: "2025-10-06T14:00:00Z",
        affectsBSC: true
      },
      {
        id: "task-3",
        taskName: "Security Audit Review",
        completedDate: "2025-10-05",
        category: "internal",
        baseScore: 25,
        timeBonus: 0,
        qualityScore: 15,
        totalScore: 40,
        complexity: 5,
        estimatedTime: 8,
        actualTime: 8.5,
        verificationStatus: "submitted",
        affectsBSC: false
      }
    ]

    const mockGoals: Goal[] = [
      {
        id: "goal-1",
        title: "Complete AWS Certification",
        description: "Obtain AWS Solutions Architect certification",
        category: "Learning & Development",
        targetDate: "2025-12-31",
        progress: 75,
        status: "in_progress",
        milestones: [
          { name: "Study Materials", completed: true, date: "2025-08-01" },
          { name: "Practice Exams", completed: true, date: "2025-09-15" },
          { name: "Final Exam", completed: false, date: "2025-11-30" }
        ]
      },
      {
        id: "goal-2",
        title: "Reduce Response Time",
        description: "Achieve average response time under 2 hours",
        category: "Performance",
        targetDate: "2025-11-30",
        progress: 60,
        status: "in_progress",
        milestones: [
          { name: "Baseline Measurement", completed: true, date: "2025-09-01" },
          { name: "Process Optimization", completed: false, date: "2025-10-31" },
          { name: "Target Achievement", completed: false, date: "2025-11-30" }
        ]
      }
    ]

    setAssignedMetrics(mockAssignedMetrics)
    setRecentTasks(mockRecentTasks)
    setGoals(mockGoals)

    // Calculate overall performance score
    const totalWeight = mockAssignedMetrics.reduce((sum, metric) => sum + metric.weight, 0)
    const weightedScore = mockAssignedMetrics.reduce((sum, metric) => sum + (metric.score * metric.weight / 100), 0)
    const currentScore = Math.round((weightedScore / totalWeight) * 100)

    const categoryScores = {
      financial: Math.round(mockAssignedMetrics.filter(m => m.category === "financial").reduce((sum, m) => sum + m.score, 0) / mockAssignedMetrics.filter(m => m.category === "financial").length),
      customer: Math.round(mockAssignedMetrics.filter(m => m.category === "customer").reduce((sum, m) => sum + m.score, 0) / mockAssignedMetrics.filter(m => m.category === "customer").length),
      internal: Math.round(mockAssignedMetrics.filter(m => m.category === "internal").reduce((sum, m) => sum + m.score, 0) / mockAssignedMetrics.filter(m => m.category === "internal").length),
      learning: Math.round(mockAssignedMetrics.filter(m => m.category === "learning").reduce((sum, m) => sum + m.score, 0) / mockAssignedMetrics.filter(m => m.category === "learning").length)
    }

    setPerformanceScore({
      current: currentScore,
      target: 85,
      financial: categoryScores.financial || 0,
      customer: categoryScores.customer || 0,
      internal: categoryScores.internal || 0,
      learning: categoryScores.learning || 0,
      yearToDate: 84,
      projectedYear: Math.round(currentScore * 1.05),
      rank: currentScore >= 90 ? "Top 10%" : currentScore >= 80 ? "Top 25%" : "Top 50%",
      improvement: 5
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-600 bg-green-100 border-green-200"
      case "on_track": return "text-blue-600 bg-blue-100 border-blue-200"
      case "at_risk": return "text-yellow-600 bg-yellow-100 border-yellow-200"
      case "behind": return "text-red-600 bg-red-100 border-red-200"
      default: return "text-gray-600 bg-gray-100 border-gray-200"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "financial": return "💰"
      case "customer": return "👥"
      case "internal": return "⚙️"
      case "learning": return "📚"
      default: return "📊"
    }
  }

  const getVerificationBadge = (task: TaskScore) => {
    switch (task.verificationStatus) {
      case "verified":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3" />
            Verified {task.affectsBSC ? "✓ BSC" : ""}
          </Badge>
        )
      case "submitted":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-800 border-yellow-300">
            <Clock className="w-3 h-3" />
            Pending Verification
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Rejected
          </Badge>
        )
      case "needs_revision":
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-orange-50 text-orange-800 border-orange-300">
            <AlertTriangle className="w-3 h-3" />
            Needs Revision
          </Badge>
        )
      default:
        return null
    }
  }

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return `${Math.floor(diffMins / 1440)}d ago`
  }

  const balancedScorecardData = [
    { name: "Financial", score: performanceScore.financial, color: "#10B981" },
    { name: "Customer", score: performanceScore.customer, color: "#3B82F6" },
    { name: "Internal", score: performanceScore.internal, color: "#F59E0B" },
    { name: "Learning", score: performanceScore.learning, color: "#8B5CF6" }
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Real-Time Performance Dashboard</h1>
          <p className="text-muted-foreground">Live tracking of your balanced scorecard metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={loadPerformanceData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <div className="text-sm text-muted-foreground">
            Last updated: {formatLastUpdated(lastRefresh.toISOString())}
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
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

      {/* Performance Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-orange-600" />
              Overall Performance Score
            </CardTitle>
            <CardDescription>Your current balanced scorecard rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold text-blue-600">{performanceScore.current}%</div>
                <div className="text-sm text-muted-foreground">
                  Target: {performanceScore.target}% | {performanceScore.rank}
                </div>
                <div className="flex items-center gap-1 text-sm mt-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">+{performanceScore.improvement}% this month</span>
                </div>
              </div>
              <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ value: performanceScore.current }]}>
                    <RadialBar dataKey="value" cornerRadius={10} fill="#3B82F6" />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Year to Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceScore.yearToDate}%</div>
            <Progress value={performanceScore.yearToDate} className="mt-2" />
            <div className="text-sm text-muted-foreground mt-1">
              Projected: {performanceScore.projectedYear}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {balancedScorecardData.map((category) => (
                <div key={category.name} className="flex items-center justify-between">
                  <span className="text-sm">{category.name}</span>
                  <span className="font-medium">{category.score}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="metrics" className="gap-2">
            <Target className="h-4 w-4" />
            My Metrics
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Task Scores
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Star className="h-4 w-4" />
            Goals & Milestones
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid gap-6">
            {assignedMetrics.map((metric) => (
              <Card key={metric.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{getCategoryIcon(metric.category)}</div>
                      <div>
                        <h4 className="font-semibold text-lg">{metric.name}</h4>
                        <p className="text-sm text-muted-foreground">{metric.description}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(metric.status)}>
                      {metric.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Current Progress</span>
                          <span className="text-lg font-bold">
                            {metric.currentValue}{metric.unit}
                          </span>
                        </div>
                        <Progress 
                          value={(metric.currentValue / metric.targetValue) * 100} 
                          className="h-3"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>0{metric.unit}</span>
                          <span>Target: {metric.targetValue}{metric.unit}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Score:</span>
                          <div className="font-semibold">{metric.score}/100</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Weight:</span>
                          <div className="font-semibold">{metric.weight}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Frequency:</span>
                          <div className="font-semibold capitalize">{metric.frequency}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Next Due:</span>
                          <div className="font-semibold">{metric.nextDue}</div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <h5 className="font-medium mb-3">Performance Trend</h5>
                      <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={metric.historicalData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString()} />
                          <YAxis />
                          <Tooltip 
                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                            formatter={(value, name) => [
                              `${value}${metric.unit}`,
                              name === 'value' ? 'Actual' : 'Target'
                            ]}
                          />
                          <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                          <Line type="monotone" dataKey="target" stroke="#10B981" strokeDasharray="5 5" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                    <span>Last updated: {formatLastUpdated(metric.lastUpdated)}</span>
                    <div className="flex items-center gap-1">
                      {metric.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : metric.trend === "down" ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <Activity className="h-4 w-4 text-gray-600" />
                      )}
                      <span>Trending {metric.trend}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Task Scores</h2>
            <Badge variant="outline">
              Total Score: {recentTasks.reduce((sum, task) => sum + task.totalScore, 0)} points
            </Badge>
          </div>

          <div className="grid gap-4">
            {recentTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-lg">{getCategoryIcon(task.category)}</div>
                        <div>
                          <h4 className="font-semibold">{task.taskName}</h4>
                          <p className="text-sm text-muted-foreground">
                            Completed on {new Date(task.completedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">{task.baseScore}</div>
                          <div className="text-xs text-muted-foreground">Base Score</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">+{task.timeBonus}</div>
                          <div className="text-xs text-muted-foreground">Time Bonus</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-lg font-bold text-purple-600">+{task.qualityScore}</div>
                          <div className="text-xs text-muted-foreground">Quality Score</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-lg font-bold text-orange-600">{task.totalScore}</div>
                          <div className="text-xs text-muted-foreground">Total Score</div>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-lg font-bold text-gray-600">L{task.complexity}</div>
                          <div className="text-xs text-muted-foreground">Complexity</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Time Performance:</span>
                      <div className={`font-medium ${task.actualTime <= task.estimatedTime ? 'text-green-600' : 'text-red-600'}`}>
                        {task.actualTime}h / {task.estimatedTime}h estimated
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Efficiency:</span>
                      <div className="font-medium">
                        {Math.round((task.estimatedTime / task.actualTime) * 100)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <h2 className="text-xl font-semibold">Personal Goals & Milestones</h2>
          
          <div className="grid gap-6">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                    <Badge variant={goal.status === "completed" ? "default" : "secondary"}>
                      {goal.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">Milestones</h5>
                      <div className="space-y-2">
                        {goal.milestones.map((milestone, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${
                              milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <span className={`text-sm ${
                              milestone.completed ? 'line-through text-muted-foreground' : ''
                            }`}>
                              {milestone.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(milestone.date).toLocaleDateString()}
                            </span>
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

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Balanced Scorecard Trends</CardTitle>
                <CardDescription>Performance across all four perspectives</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={balancedScorecardData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Score Progression</CardTitle>
                <CardDescription>Your performance journey over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', score: 75 },
                    { month: 'Feb', score: 78 },
                    { month: 'Mar', score: 82 },
                    { month: 'Apr', score: 79 },
                    { month: 'May', score: 85 },
                    { month: 'Jun', score: 87 },
                    { month: 'Jul', score: 84 },
                    { month: 'Aug', score: 88 },
                    { month: 'Sep', score: 86 },
                    { month: 'Oct', score: performanceScore.current }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>Performance Insight:</strong> You're trending upward with a {performanceScore.improvement}% improvement this month. 
              Focus on your "Learning & Growth" metrics to reach the 90% excellence threshold.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  )
}