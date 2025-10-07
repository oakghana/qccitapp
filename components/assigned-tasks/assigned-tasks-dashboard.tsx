"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Clock, 
  MapPin, 
  Wrench, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Calendar,
  Headphones,
  User,
  Building2,
  Filter,
  Search,
  Download,
  Upload
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface AssignedTask {
  id: string
  type: "repair" | "service_desk"
  title: string
  description: string
  priority: "low" | "medium" | "high" | "critical"
  status: "assigned" | "in_progress" | "completed" | "on_hold"
  assignedBy: string
  assignedByRole: string
  assignedDate: string
  dueDate: string
  location: string
  requestedBy: string
  deviceInfo?: {
    type: string
    model: string
    serialNumber: string
  }
  ticketInfo?: {
    category: string
    subcategory: string
    ticketNumber: string
  }
  attachments: string[]
  workNotes: string[]
  completionDate?: string
  estimatedHours?: number
  actualHours?: number
}

interface WorkStatusUpdate {
  taskId: string
  status: AssignedTask["status"]
  notes: string
  hoursWorked?: number
}

export function AssignedTasksDashboard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<AssignedTask[]>([])
  const [filteredTasks, setFilteredTasks] = useState<AssignedTask[]>([])
  const [selectedTask, setSelectedTask] = useState<AssignedTask | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [workNotes, setWorkNotes] = useState("")
  const [hoursWorked, setHoursWorked] = useState("")

  // Load assigned tasks
  useEffect(() => {
    const mockTasks: AssignedTask[] = [
      {
        id: "ASN-001",
        type: "repair",
        title: "Laptop Screen Replacement",
        description: "Dell Latitude 5520 screen is cracked and needs replacement. User reports display issues.",
        priority: "high",
        status: "assigned",
        assignedBy: "John Appiah",
        assignedByRole: "IT Head",
        assignedDate: "2024-01-15",
        dueDate: "2024-01-22",
        location: "Kumasi Branch",
        requestedBy: "Sarah Osei",
        deviceInfo: {
          type: "Laptop",
          model: "Dell Latitude 5520",
          serialNumber: "DL5520001"
        },
        attachments: ["damage-report.pdf", "user-statement.txt"],
        workNotes: [],
        estimatedHours: 3
      },
      {
        id: "ASN-002",
        type: "service_desk",
        title: "Email Configuration Issue",
        description: "User unable to receive emails on Outlook. Configuration assistance needed.",
        priority: "medium",
        status: "in_progress",
        assignedBy: "John Appiah",
        assignedByRole: "IT Head",
        assignedDate: "2024-01-14",
        dueDate: "2024-01-16",
        location: "Kumasi Branch",
        requestedBy: "Michael Asante",
        ticketInfo: {
          category: "Software",
          subcategory: "Email",
          ticketNumber: "TKT-2024-001"
        },
        attachments: ["email-error.png"],
        workNotes: ["Initial diagnosis completed", "Checking server settings"],
        estimatedHours: 2,
        actualHours: 1.5
      },
      {
        id: "ASN-003",
        type: "repair",
        title: "Desktop Hard Drive Replacement",
        description: "HP EliteDesk showing hard drive failure. Data backup and drive replacement needed.",
        priority: "critical",
        status: "completed",
        assignedBy: "John Appiah", 
        assignedByRole: "IT Head",
        assignedDate: "2024-01-10",
        dueDate: "2024-01-17",
        location: "Kumasi Branch",
        requestedBy: "IT Department",
        deviceInfo: {
          type: "Desktop",
          model: "HP EliteDesk 800",
          serialNumber: "HP800015"
        },
        attachments: ["diagnostic-report.pdf", "backup-verification.xlsx"],
        workNotes: ["Data backed up successfully", "New SSD installed", "System restored and tested"],
        estimatedHours: 4,
        actualHours: 3.5,
        completionDate: "2024-01-16"
      },
      {
        id: "ASN-004",
        type: "service_desk",
        title: "Network Connectivity Issue",
        description: "Multiple users reporting intermittent network connection drops in accounting department.",
        priority: "high",
        status: "on_hold",
        assignedBy: "John Appiah",
        assignedByRole: "IT Head", 
        assignedDate: "2024-01-13",
        dueDate: "2024-01-20",
        location: "Kumasi Branch",
        requestedBy: "Accounting Department",
        ticketInfo: {
          category: "Network",
          subcategory: "Connectivity",
          ticketNumber: "TKT-2024-003"
        },
        attachments: ["network-logs.txt", "affected-users.xlsx"],
        workNotes: ["Network equipment inspected", "Waiting for replacement switch from vendor"],
        estimatedHours: 6,
        actualHours: 2
      }
    ]
    
    setTasks(mockTasks)
  }, [])

  // Filter tasks based on active filters
  useEffect(() => {
    let filtered = tasks

    // Filter by tab (task type)
    if (activeTab !== "all") {
      filtered = filtered.filter(task => task.type === activeTab)
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => task.priority === priorityFilter)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredTasks(filtered)
  }, [tasks, activeTab, statusFilter, priorityFilter, searchQuery])

  const updateTaskStatus = (taskId: string, updates: Partial<WorkStatusUpdate>) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? {
              ...task,
              status: updates.status || task.status,
              workNotes: updates.notes 
                ? [...task.workNotes, `${new Date().toLocaleDateString()}: ${updates.notes}`]
                : task.workNotes,
              actualHours: updates.hoursWorked || task.actualHours,
              completionDate: updates.status === "completed" 
                ? new Date().toISOString().split("T")[0] 
                : task.completionDate
            }
          : task
      )
    )
  }

  const handleUpdateStatus = () => {
    if (selectedTask) {
      updateTaskStatus(selectedTask.id, {
        status: selectedTask.status as AssignedTask["status"],
        notes: workNotes,
        hoursWorked: hoursWorked ? parseFloat(hoursWorked) : undefined
      })
      setSelectedTask(null)
      setWorkNotes("")
      setHoursWorked("")
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300"
      case "high": return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "low": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
      default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned": return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300"
      case "in_progress": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
      case "completed": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300"
      case "on_hold": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300"
      default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getTaskStats = () => {
    const total = tasks.length
    const byStatus = {
      assigned: tasks.filter(t => t.status === "assigned").length,
      in_progress: tasks.filter(t => t.status === "in_progress").length,
      completed: tasks.filter(t => t.status === "completed").length,
      on_hold: tasks.filter(t => t.status === "on_hold").length
    }
    const byType = {
      repair: tasks.filter(t => t.type === "repair").length,
      service_desk: tasks.filter(t => t.type === "service_desk").length
    }
    return { total, byStatus, byType }
  }

  const stats = getTaskStats()

  return (
    <div className="space-y-6">
      {/* Header with QCC Branding */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-yellow-600 flex items-center justify-center shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Assigned Tasks</h1>
            <p className="text-muted-foreground">
              Tasks assigned by your IT Head • {user?.location?.replace('_', ' ')} Office
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            QCC IT Services
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned</CardTitle>
            <div className="text-2xl font-bold">{stats.byStatus.assigned}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <div className="text-2xl font-bold">{stats.byStatus.in_progress}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <div className="text-2xl font-bold">{stats.byStatus.completed}</div>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search tasks</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search tasks, descriptions, or users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tasks Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            All Tasks ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="repair" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Repairs ({stats.byType.repair})
          </TabsTrigger>
          <TabsTrigger value="service_desk" className="flex items-center gap-2">
            <Headphones className="h-4 w-4" />
            Service Desk ({stats.byType.service_desk})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  {activeTab === "repair" ? (
                    <Wrench className="h-8 w-8 text-muted-foreground" />
                  ) : activeTab === "service_desk" ? (
                    <Headphones className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                <p className="text-muted-foreground">
                  No {activeTab === "all" ? "" : activeTab.replace("_", " ")} tasks match your current filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {task.type === "repair" ? (
                              <Wrench className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Headphones className="h-4 w-4 text-green-600" />
                            )}
                            <CardTitle className="text-lg">{task.title}</CardTitle>
                          </div>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                        
                        <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Assigned by: {task.assignedBy} ({task.assignedByRole})
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {task.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          {task.estimatedHours && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Est: {task.estimatedHours}h
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedTask(task)}
                            >
                              Update Status
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Update Task Status</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="status">Status</Label>
                                <Select 
                                  value={selectedTask?.status} 
                                  onValueChange={(value) => 
                                    setSelectedTask(prev => prev ? {...prev, status: value as AssignedTask["status"]} : null)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="assigned">Assigned</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="on_hold">On Hold</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor="workNotes">Work Notes</Label>
                                <Textarea
                                  id="workNotes"
                                  placeholder="Describe the work performed or current status..."
                                  value={workNotes}
                                  onChange={(e) => setWorkNotes(e.target.value)}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="hoursWorked">Hours Worked</Label>
                                <Input
                                  id="hoursWorked"
                                  type="number"
                                  step="0.5"
                                  placeholder="0.0"
                                  value={hoursWorked}
                                  onChange={(e) => setHoursWorked(e.target.value)}
                                />
                              </div>
                              
                              <Button onClick={handleUpdateStatus} className="w-full">
                                Update Status
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {task.type === "repair" ? (
                                  <Wrench className="h-5 w-5" />
                                ) : (
                                  <Headphones className="h-5 w-5" />
                                )}
                                {task.title}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="font-semibold">Task ID</Label>
                                  <p className="text-sm">{task.id}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Type</Label>
                                  <p className="text-sm capitalize">{task.type.replace("_", " ")}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Assigned By</Label>
                                  <p className="text-sm">{task.assignedBy} ({task.assignedByRole})</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Requested By</Label>
                                  <p className="text-sm">{task.requestedBy}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Location</Label>
                                  <p className="text-sm">{task.location}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Due Date</Label>
                                  <p className="text-sm">{new Date(task.dueDate).toLocaleDateString()}</p>
                                </div>
                              </div>
                              
                              {task.deviceInfo && (
                                <div>
                                  <Label className="font-semibold">Device Information</Label>
                                  <div className="text-sm bg-muted p-2 rounded">
                                    <p><strong>Type:</strong> {task.deviceInfo.type}</p>
                                    <p><strong>Model:</strong> {task.deviceInfo.model}</p>
                                    <p><strong>Serial:</strong> {task.deviceInfo.serialNumber}</p>
                                  </div>
                                </div>
                              )}
                              
                              {task.ticketInfo && (
                                <div>
                                  <Label className="font-semibold">Ticket Information</Label>
                                  <div className="text-sm bg-muted p-2 rounded">
                                    <p><strong>Ticket #:</strong> {task.ticketInfo.ticketNumber}</p>
                                    <p><strong>Category:</strong> {task.ticketInfo.category}</p>
                                    <p><strong>Subcategory:</strong> {task.ticketInfo.subcategory}</p>
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <Label className="font-semibold">Description</Label>
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                              </div>
                              
                              {task.workNotes.length > 0 && (
                                <div>
                                  <Label className="font-semibold">Work Notes</Label>
                                  <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {task.workNotes.map((note, index) => (
                                      <div key={index} className="text-sm bg-muted p-2 rounded">
                                        {note}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {task.attachments.length > 0 && (
                                <div>
                                  <Label className="font-semibold">Attachments</Label>
                                  <div className="flex gap-2 flex-wrap">
                                    {task.attachments.map((file, index) => (
                                      <Button key={index} variant="outline" size="sm">
                                        <FileText className="h-4 w-4 mr-2" />
                                        {file}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                    
                    {task.workNotes.length > 0 && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Latest Work Notes:</p>
                        <p className="text-sm">{task.workNotes[task.workNotes.length - 1]}</p>
                      </div>
                    )}
                    
                    {task.actualHours && (
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Hours Worked: {task.actualHours}</span>
                        {task.estimatedHours && (
                          <span>
                            Progress: {Math.round((task.actualHours / task.estimatedHours) * 100)}%
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
