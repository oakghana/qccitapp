"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Plus,
  Save,
  Edit,
  Trash2,
  Users,
  Target,
  Calendar,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  History,
  TrendingUp,
  Award,
  Settings
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface PerformanceMetric {
  id: string
  name: string
  description: string
  category: "financial" | "customer" | "internal" | "learning"
  measurementType: "percentage" | "number" | "hours" | "rating"
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
  targetValue: number
  weight: number // Weight in the balanced scorecard (total should be 100%)
  formula: string // How the metric is calculated
  assignedBy: string
  assignedDate: string
  isActive: boolean
  auditTrail: AuditEntry[]
}

interface StaffMetricAssignment {
  id: string
  staffId: string
  staffName: string
  staffEmail: string
  metricId: string
  customTargetValue?: number
  customWeight?: number
  assignedBy: string
  assignedDate: string
  approvedBy?: string
  approvalDate?: string
  status: "pending" | "approved" | "active" | "suspended"
  notes?: string
}

interface TaskScoring {
  id: string
  taskName: string
  description: string
  category: "financial" | "customer" | "internal" | "learning"
  complexity: 1 | 2 | 3 | 4 | 5 // 1=Very Easy, 5=Very Complex
  baseScore: number // Base score for completion
  timeWeight: number // Additional scoring based on completion time
  qualityWeight: number // Additional scoring based on quality
  createdBy: string
  createdDate: string
  isActive: boolean
}

interface AuditEntry {
  id: string
  action: string
  performedBy: string
  performedDate: string
  oldValue?: any
  newValue?: any
  reason?: string
}

interface CollaborationRequest {
  id: string
  requestType: "metric_assignment" | "metric_modification" | "task_scoring"
  requestedBy: string
  targetStaffId?: string
  metricId?: string
  taskId?: string
  proposedChanges: any
  status: "pending" | "approved" | "rejected"
  approvers: string[]
  approvedBy: string[]
  rejectionReason?: string
  createdDate: string
}

export function DynamicBalancedScorecardManager() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [staffAssignments, setStaffAssignments] = useState<StaffMetricAssignment[]>([])
  const [taskScoring, setTaskScoring] = useState<TaskScoring[]>([])
  const [collaborationRequests, setCollaborationRequests] = useState<CollaborationRequest[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>("")
  const [newMetric, setNewMetric] = useState<Partial<PerformanceMetric>>({})
  const [newTaskScore, setNewTaskScore] = useState<Partial<TaskScoring>>({})
  const [showMetricDialog, setShowMetricDialog] = useState(false)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("metrics")

  // Role-based access control
  if (!user || !["it_head", "regional_it_head", "admin"].includes(user.role)) {
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
              You don't have permission to manage performance metrics. This feature is only available to IT Heads, Regional IT Heads, and System Administrators.
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
    loadInitialData()
  }, [])

  const loadInitialData = () => {
    // Mock data - in real implementation, this would come from API
    const mockMetrics: PerformanceMetric[] = [
      {
        id: "metric-1",
        name: "Ticket Resolution Rate",
        description: "Percentage of tickets resolved within SLA",
        category: "customer",
        measurementType: "percentage",
        frequency: "weekly",
        targetValue: 95,
        weight: 25,
        formula: "(Resolved Tickets / Total Tickets) * 100",
        assignedBy: user?.id || "admin",
        assignedDate: "2025-01-01",
        isActive: true,
        auditTrail: []
      },
      {
        id: "metric-2",
        name: "Cost Per Ticket",
        description: "Average cost to resolve each support ticket",
        category: "financial",
        measurementType: "number",
        frequency: "monthly",
        targetValue: 50,
        weight: 20,
        formula: "Total Operational Cost / Total Tickets Resolved",
        assignedBy: user?.id || "admin",
        assignedDate: "2025-01-01",
        isActive: true,
        auditTrail: []
      },
      {
        id: "metric-3",
        name: "Process Improvement Initiatives",
        description: "Number of process improvements implemented",
        category: "internal",
        measurementType: "number",
        frequency: "quarterly",
        targetValue: 3,
        weight: 15,
        formula: "Count of Approved Process Improvements",
        assignedBy: user?.id || "admin",
        assignedDate: "2025-01-01",
        isActive: true,
        auditTrail: []
      },
      {
        id: "metric-4",
        name: "Training Completion Rate",
        description: "Percentage of required training completed",
        category: "learning",
        measurementType: "percentage",
        frequency: "quarterly",
        targetValue: 100,
        weight: 20,
        formula: "(Completed Trainings / Required Trainings) * 100",
        assignedBy: user?.id || "admin",
        assignedDate: "2025-01-01",
        isActive: true,
        auditTrail: []
      }
    ]

    const mockTaskScoring: TaskScoring[] = [
      {
        id: "task-score-1",
        taskName: "Password Reset",
        description: "Basic user password reset task",
        category: "customer",
        complexity: 1,
        baseScore: 2,
        timeWeight: 0.5,
        qualityWeight: 1,
        createdBy: user?.id || "admin",
        createdDate: "2025-01-01",
        isActive: true
      },
      {
        id: "task-score-2",
        taskName: "Server Maintenance",
        description: "Routine server maintenance and updates",
        category: "internal",
        complexity: 4,
        baseScore: 15,
        timeWeight: 3,
        qualityWeight: 5,
        createdBy: user?.id || "admin",
        createdDate: "2025-01-01",
        isActive: true
      },
      {
        id: "task-score-3",
        taskName: "Security Audit",
        description: "Comprehensive security audit and reporting",
        category: "internal",
        complexity: 5,
        baseScore: 25,
        timeWeight: 5,
        qualityWeight: 10,
        createdBy: user?.id || "admin",
        createdDate: "2025-01-01",
        isActive: true
      }
    ]

    const mockStaffList = [
      { id: "staff-1", name: "John Doe", email: "john.doe@qcc.com.gh" },
      { id: "staff-2", name: "Jane Smith", email: "jane.smith@qcc.com.gh" },
      { id: "staff-3", name: "Michael Johnson", email: "michael.johnson@qcc.com.gh" }
    ]

    setMetrics(mockMetrics)
    setTaskScoring(mockTaskScoring)
  }

  const createMetric = () => {
    if (!newMetric.name || !newMetric.description || !newMetric.category) {
      alert("Please fill in all required fields")
      return
    }

    const metric: PerformanceMetric = {
      id: `metric-${Date.now()}`,
      name: newMetric.name,
      description: newMetric.description,
      category: newMetric.category as any,
      measurementType: newMetric.measurementType as any || "percentage",
      frequency: newMetric.frequency as any || "monthly",
      targetValue: newMetric.targetValue || 100,
      weight: newMetric.weight || 10,
      formula: newMetric.formula || "Manual calculation",
      assignedBy: user?.id || "admin",
      assignedDate: new Date().toISOString().split('T')[0],
      isActive: true,
      auditTrail: [{
        id: `audit-${Date.now()}`,
        action: "Created metric",
        performedBy: user?.name || "System",
        performedDate: new Date().toISOString(),
        newValue: newMetric
      }]
    }

    setMetrics([...metrics, metric])
    setNewMetric({})
    setShowMetricDialog(false)
  }

  const createTaskScore = () => {
    if (!newTaskScore.taskName || !newTaskScore.description || !newTaskScore.category) {
      alert("Please fill in all required fields")
      return
    }

    const taskScore: TaskScoring = {
      id: `task-score-${Date.now()}`,
      taskName: newTaskScore.taskName,
      description: newTaskScore.description,
      category: newTaskScore.category as any,
      complexity: newTaskScore.complexity as any || 1,
      baseScore: newTaskScore.baseScore || 5,
      timeWeight: newTaskScore.timeWeight || 1,
      qualityWeight: newTaskScore.qualityWeight || 2,
      createdBy: user?.id || "admin",
      createdDate: new Date().toISOString().split('T')[0],
      isActive: true
    }

    setTaskScoring([...taskScoring, taskScore])
    setNewTaskScore({})
    setShowTaskDialog(false)
  }

  const assignMetricToStaff = (metricId: string, staffId: string) => {
    // In real implementation, this would create a collaboration request for approval
    const assignment: StaffMetricAssignment = {
      id: `assignment-${Date.now()}`,
      staffId,
      staffName: "Staff Member", // Would be fetched from staff data
      staffEmail: "staff@qcc.com.gh",
      metricId,
      assignedBy: user?.id || "admin",
      assignedDate: new Date().toISOString().split('T')[0],
      status: "pending",
      notes: "Metric assigned for evaluation"
    }

    setStaffAssignments([...staffAssignments, assignment])
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "financial": return "bg-green-100 text-green-800 border-green-200"
      case "customer": return "bg-blue-100 text-blue-800 border-blue-200"
      case "internal": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "learning": return "bg-purple-100 text-purple-800 border-purple-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getComplexityColor = (complexity: number) => {
    switch (complexity) {
      case 1: return "bg-green-100 text-green-800"
      case 2: return "bg-blue-100 text-blue-800"
      case 3: return "bg-yellow-100 text-yellow-800"
      case 4: return "bg-orange-100 text-orange-800"
      case 5: return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dynamic Balanced Scorecard Manager</h1>
          <p className="text-muted-foreground">Collaborative Performance Metrics & Task Scoring System</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {metrics.length} Metrics
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Target className="h-3 w-3" />
            {taskScoring.length} Task Types
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="metrics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance Metrics
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <Target className="h-4 w-4" />
            Task Scoring
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <Users className="h-4 w-4" />
            Staff Assignments
          </TabsTrigger>
          <TabsTrigger value="collaboration" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Collaboration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Performance Metrics Management</h2>
            <Dialog open={showMetricDialog} onOpenChange={setShowMetricDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Metric
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Performance Metric</DialogTitle>
                  <DialogDescription>
                    Define a new measurable performance metric for staff evaluation
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="metric-name">Metric Name *</Label>
                      <Input
                        id="metric-name"
                        value={newMetric.name || ""}
                        onChange={(e) => setNewMetric({...newMetric, name: e.target.value})}
                        placeholder="e.g., Ticket Resolution Rate"
                      />
                    </div>
                    <div>
                      <Label htmlFor="metric-category">Category *</Label>
                      <Select
                        value={newMetric.category}
                        onValueChange={(value) => setNewMetric({...newMetric, category: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="internal">Internal Process</SelectItem>
                          <SelectItem value="learning">Learning & Growth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="metric-description">Description *</Label>
                    <Textarea
                      id="metric-description"
                      value={newMetric.description || ""}
                      onChange={(e) => setNewMetric({...newMetric, description: e.target.value})}
                      placeholder="Describe what this metric measures and why it's important"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="metric-type">Measurement Type</Label>
                      <Select
                        value={newMetric.measurementType}
                        onValueChange={(value) => setNewMetric({...newMetric, measurementType: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="rating">Rating (1-5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="metric-frequency">Frequency</Label>
                      <Select
                        value={newMetric.frequency}
                        onValueChange={(value) => setNewMetric({...newMetric, frequency: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="metric-weight">Weight (%)</Label>
                      <Input
                        id="metric-weight"
                        type="number"
                        min="1"
                        max="100"
                        value={newMetric.weight || ""}
                        onChange={(e) => setNewMetric({...newMetric, weight: parseInt(e.target.value)})}
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="metric-target">Target Value</Label>
                      <Input
                        id="metric-target"
                        type="number"
                        value={newMetric.targetValue || ""}
                        onChange={(e) => setNewMetric({...newMetric, targetValue: parseInt(e.target.value)})}
                        placeholder="e.g., 95 for 95%"
                      />
                    </div>
                    <div>
                      <Label htmlFor="metric-formula">Calculation Formula</Label>
                      <Input
                        id="metric-formula"
                        value={newMetric.formula || ""}
                        onChange={(e) => setNewMetric({...newMetric, formula: e.target.value})}
                        placeholder="e.g., (Completed / Total) * 100"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowMetricDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createMetric} className="gap-2">
                      <Save className="h-4 w-4" />
                      Create Metric
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {metrics.map((metric) => (
              <Card key={metric.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">{metric.name}</h4>
                        <Badge className={getCategoryColor(metric.category)}>
                          {metric.category}
                        </Badge>
                        <Badge variant="outline">
                          {metric.frequency}
                        </Badge>
                        <Badge variant="outline">
                          Weight: {metric.weight}%
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{metric.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Target Value:</span> {metric.targetValue}
                          {metric.measurementType === "percentage" && "%"}
                        </div>
                        <div>
                          <span className="font-medium">Measurement:</span> {metric.measurementType}
                        </div>
                        <div>
                          <span className="font-medium">Formula:</span> {metric.formula}
                        </div>
                        <div>
                          <span className="font-medium">Assigned By:</span> {metric.assignedBy}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <History className="h-4 w-4" />
                      </Button>
                      <Select onValueChange={(staffId) => assignMetricToStaff(metric.id, staffId)}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Assign to staff" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="staff-1">John Doe</SelectItem>
                          <SelectItem value="staff-2">Jane Smith</SelectItem>
                          <SelectItem value="staff-3">Michael Johnson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Task Scoring Configuration</h2>
            <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Task Scoring
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Task Scoring Rule</DialogTitle>
                  <DialogDescription>
                    Define scoring weights for different types of tasks
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="task-name">Task Name *</Label>
                      <Input
                        id="task-name"
                        value={newTaskScore.taskName || ""}
                        onChange={(e) => setNewTaskScore({...newTaskScore, taskName: e.target.value})}
                        placeholder="e.g., Server Maintenance"
                      />
                    </div>
                    <div>
                      <Label htmlFor="task-category">Category *</Label>
                      <Select
                        value={newTaskScore.category}
                        onValueChange={(value) => setNewTaskScore({...newTaskScore, category: value as any})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="internal">Internal Process</SelectItem>
                          <SelectItem value="learning">Learning & Growth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="task-description">Description *</Label>
                    <Textarea
                      id="task-description"
                      value={newTaskScore.description || ""}
                      onChange={(e) => setNewTaskScore({...newTaskScore, description: e.target.value})}
                      placeholder="Describe the task and what it involves"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="task-complexity">Complexity</Label>
                      <Select
                        value={newTaskScore.complexity?.toString()}
                        onValueChange={(value) => setNewTaskScore({...newTaskScore, complexity: parseInt(value) as any})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Very Easy</SelectItem>
                          <SelectItem value="2">2 - Easy</SelectItem>
                          <SelectItem value="3">3 - Medium</SelectItem>
                          <SelectItem value="4">4 - Hard</SelectItem>
                          <SelectItem value="5">5 - Very Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="base-score">Base Score</Label>
                      <Input
                        id="base-score"
                        type="number"
                        min="1"
                        value={newTaskScore.baseScore || ""}
                        onChange={(e) => setNewTaskScore({...newTaskScore, baseScore: parseInt(e.target.value)})}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="time-weight">Time Weight</Label>
                      <Input
                        id="time-weight"
                        type="number"
                        step="0.1"
                        value={newTaskScore.timeWeight || ""}
                        onChange={(e) => setNewTaskScore({...newTaskScore, timeWeight: parseFloat(e.target.value)})}
                        placeholder="1.0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quality-weight">Quality Weight</Label>
                      <Input
                        id="quality-weight"
                        type="number"
                        step="0.1"
                        value={newTaskScore.qualityWeight || ""}
                        onChange={(e) => setNewTaskScore({...newTaskScore, qualityWeight: parseFloat(e.target.value)})}
                        placeholder="2.0"
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Scoring Formula:</strong> Base Score + (Time Bonus × Time Weight) + (Quality Score × Quality Weight)
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createTaskScore} className="gap-2">
                      <Save className="h-4 w-4" />
                      Create Task Score
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {taskScoring.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">{task.taskName}</h4>
                        <Badge className={getCategoryColor(task.category)}>
                          {task.category}
                        </Badge>
                        <Badge className={getComplexityColor(task.complexity)}>
                          Level {task.complexity}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Base Score:</span> {task.baseScore} points
                        </div>
                        <div>
                          <span className="font-medium">Time Weight:</span> {task.timeWeight}×
                        </div>
                        <div>
                          <span className="font-medium">Quality Weight:</span> {task.qualityWeight}×
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">Max Possible Score:</span> {task.baseScore + (task.timeWeight * 2) + (task.qualityWeight * 5)} points
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <h2 className="text-xl font-semibold">Staff Metric Assignments</h2>
          
          {staffAssignments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Staff Assignments Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start by assigning performance metrics to staff members from the Metrics tab.
                </p>
                <Button onClick={() => setActiveTab("metrics")}>
                  Go to Metrics
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {staffAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{assignment.staffName}</h4>
                        <p className="text-sm text-muted-foreground">{assignment.staffEmail}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={assignment.status === "approved" ? "default" : "secondary"}>
                          {assignment.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Assigned: {assignment.assignedDate}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="collaboration" className="space-y-6">
          <h2 className="text-xl font-semibold">Collaboration & Approval Workflow</h2>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All metric assignments and modifications require collaborative approval from IT leadership team.
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="p-12 text-center">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Collaboration Features Coming Soon</h3>
              <p className="text-muted-foreground">
                Advanced workflow management, multi-approver processes, and real-time collaboration tools are in development.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
