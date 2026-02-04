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
  FileText,
  Calendar,
  Headphones,
  User,
  Building2,
  Filter,
  Search,
  Download,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface RequesterInfo {
  email?: string
  phone?: string
  roomNumber?: string
  department?: string
  location?: string
}

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
  requesterInfo?: RequesterInfo
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
  const supabase = createClient()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<AssignedTask[]>([])
  const [filteredTasks, setFilteredTasks] = useState<AssignedTask[]>([])
  const [selectedTask, setSelectedTask] = useState<AssignedTask | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [workNotes, setWorkNotes] = useState("")
  const [hoursWorked, setHoursWorked] = useState("")
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<string>("")

  useEffect(() => {
    loadAssignedTasks()
  }, [user])

  const loadAssignedTasks = async () => {
    if (!user) return

    setLoading(true)
    try {
      const allTasks: AssignedTask[] = []

      const userName = user.name || user.email || ""

      const { data: serviceTickets, error: ticketError } = await supabase
        .from("service_tickets")
        .select("*")
        .or(`assigned_to.eq.${user.id},assigned_to_name.ilike.%${userName}%`)
        .order("created_at", { ascending: false })

      if (ticketError) {
        console.error("[v0] Error loading service tickets:", ticketError)
      } else if (serviceTickets) {
        const mappedTickets: AssignedTask[] = serviceTickets.map((ticket: any) => ({
          id: ticket.id,
          type: "service_desk" as const,
          title: ticket.title || ticket.subject || "Service Desk Request",
          description: ticket.description || ticket.notes || "",
          priority: (ticket.priority || "medium") as AssignedTask["priority"],
          status: mapTicketStatus(ticket.status),
          assignedBy: ticket.assigned_by || "IT Head",
          assignedByRole: "it_head",
          assignedDate: ticket.assigned_at || ticket.created_at,
          dueDate: ticket.due_date || "",
          location: ticket.location || ticket.requester_location || "",
          requestedBy: ticket.requester_name || ticket.submitted_by || "Unknown",
          ticketInfo: {
            category: ticket.category || "General",
            subcategory: ticket.subcategory || "",
            ticketNumber: ticket.ticket_number || ticket.id,
          },
          attachments: [],
          workNotes: ticket.work_notes ? [ticket.work_notes] : [],
          completionDate: ticket.resolved_at,
          estimatedHours: ticket.estimated_hours,
          actualHours: ticket.actual_hours,
        }))
        allTasks.push(...mappedTickets)
      }

      const { data: repairs, error: repairError } = await supabase
        .from("repair_requests")
        .select("*, devices(*)")
        .or(`assigned_to.eq.${user.id},assigned_to_name.ilike.%${userName}%`)
        .order("created_at", { ascending: false })

      if (repairError) {
        console.error("[v0] Error loading repair requests:", repairError)
      } else if (repairs) {
        const mappedRepairs: AssignedTask[] = repairs.map((repair: any) => ({
          id: repair.id,
          type: "repair" as const,
          title: repair.issue_description || repair.description || "Repair Task",
          description: repair.description || repair.issue_description || "",
          priority: (repair.priority || "medium") as AssignedTask["priority"],
          status: mapRepairStatus(repair.status),
          assignedBy: repair.assigned_by || "IT Head",
          assignedByRole: "it_head",
          assignedDate: repair.assigned_at || repair.created_at,
          dueDate: repair.due_date || "",
          location: repair.location || repair.devices?.location || "",
          requestedBy: repair.requested_by || "IT Department",
          deviceInfo: repair.devices
            ? {
                type: repair.devices.device_type || "Unknown",
                model: repair.devices.brand_model || repair.devices.model || "Unknown",
                serialNumber: repair.devices.serial_number || "",
              }
            : undefined,
          attachments: [],
          workNotes: repair.work_notes ? [repair.work_notes] : [],
          completionDate: repair.completed_at,
          estimatedHours: repair.estimated_hours,
          actualHours: repair.actual_hours,
        }))
        allTasks.push(...mappedRepairs)
      }

      allTasks.sort((a, b) => new Date(b.assignedDate).getTime() - new Date(a.assignedDate).getTime())

      setTasks(allTasks)
    } catch (error) {
      console.error("[v0] Error loading assigned tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const mapTicketStatus = (status: string): AssignedTask["status"] => {
    switch (status?.toLowerCase()) {
      case "open":
      case "new":
        return "assigned"
      case "in_progress":
      case "in-progress":
        return "in_progress"
      case "resolved":
      case "closed":
      case "completed":
        return "completed"
      case "on_hold":
      case "pending":
        return "on_hold"
      default:
        return "assigned"
    }
  }

  const mapRepairStatus = (status: string): AssignedTask["status"] => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "assigned":
        return "assigned"
      case "in_progress":
      case "in-progress":
      case "with_provider":
        return "in_progress"
      case "completed":
      case "resolved":
        return "completed"
      case "on_hold":
      case "waiting_parts":
        return "on_hold"
      default:
        return "assigned"
    }
  }

  useEffect(() => {
    let filtered = tasks

    if (activeTab !== "all") {
      filtered = filtered.filter((task) => task.type === activeTab)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.requestedBy.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredTasks(filtered)
  }, [tasks, activeTab, statusFilter, priorityFilter, searchQuery])

  const updateTaskStatus = async (
    taskId: string,
    taskType: "repair" | "service_desk",
    updates: Partial<WorkStatusUpdate>,
  ) => {
    try {
      const endpoint = taskType === "service_desk" ? "/api/service-tickets/update" : "/api/repairs/update"

      const payload: Record<string, any> = {
        id: taskId,
      }

      if (updates.status) {
        payload.status = updates.status
      }

      if (updates.notes) {
        const existingTask = tasks.find((t) => t.id === taskId)
        const existingNotes = existingTask?.workNotes.join("\n") || ""
        const newNote = `${new Date().toLocaleDateString()}: ${updates.notes}`
        payload.work_notes = existingNotes ? `${existingNotes}\n${newNote}` : newNote
      }

      if (updates.hoursWorked !== undefined) {
        payload.actual_hours = updates.hoursWorked
      }

      if (updates.status === "completed") {
        payload.completed_at = new Date().toISOString()
      }

      console.log("[v0] Updating task:", taskId, "type:", taskType, "payload:", payload)

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update task")
      }

      const result = await response.json()
      console.log("[v0] Task updated successfully:", result)

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: updates.status || task.status,
                workNotes: updates.notes
                  ? [...task.workNotes, `${new Date().toLocaleDateString()}: ${updates.notes}`]
                  : task.workNotes,
                actualHours: updates.hoursWorked || task.actualHours,
                completionDate:
                  updates.status === "completed" ? new Date().toISOString().split("T")[0] : task.completionDate,
              }
            : task,
        ),
      )

      return { success: true }
    } catch (error) {
      console.error("[v0] Error updating task:", error)
      throw error
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedTask || !newStatus) return

    setIsUpdating(true)
    try {
      await updateTaskStatus(selectedTask.id, selectedTask.type, {
        status: newStatus as AssignedTask["status"],
        notes: workNotes,
        hoursWorked: hoursWorked ? Number.parseFloat(hoursWorked) : undefined,
      })

      toast({
        title: "Task Updated",
        description: `Task status has been updated to ${newStatus.replace("_", " ")}`,
      })

      setUpdateDialogOpen(false)
      setSelectedTask(null)
      setWorkNotes("")
      setHoursWorked("")
      setNewStatus("")
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update task status",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300"
      case "on_hold":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getTaskStats = () => {
    const total = tasks.length
    const byStatus = {
      assigned: tasks.filter((t) => t.status === "assigned").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
      on_hold: tasks.filter((t) => t.status === "on_hold").length,
    }
    const byType = {
      repair: tasks.filter((t) => t.type === "repair").length,
      service_desk: tasks.filter((t) => t.type === "service_desk").length,
    }
    return { total, byStatus, byType }
  }

  const stats = getTaskStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-yellow-600 flex items-center justify-center shadow-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Assigned Tasks</h1>
            <p className="text-muted-foreground">
              Tasks assigned by your IT Head • {user?.location?.replace("_", " ")} Office
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

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search tasks
              </Label>
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
          {loading ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Loading assigned tasks...</p>
              </CardContent>
            </Card>
          ) : filteredTasks.length === 0 ? (
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
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          <Badge className={getStatusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
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
                        <Dialog
                          open={updateDialogOpen && selectedTask?.id === task.id}
                          onOpenChange={(open) => {
                            setUpdateDialogOpen(open)
                            if (open) {
                              setSelectedTask(task)
                              setNewStatus(task.status)
                            } else {
                              setSelectedTask(null)
                              setWorkNotes("")
                              setHoursWorked("")
                              setNewStatus("")
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="default" size="sm">
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
                                <Select value={newStatus} onValueChange={setNewStatus}>
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

                              <Button
                                onClick={handleUpdateStatus}
                                className="w-full"
                                disabled={isUpdating || !newStatus}
                              >
                                {isUpdating ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  "Update Status"
                                )}
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
                                  <p className="text-sm">
                                    {task.assignedBy} ({task.assignedByRole})
                                  </p>
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
                                    <p>
                                      <strong>Type:</strong> {task.deviceInfo.type}
                                    </p>
                                    <p>
                                      <strong>Model:</strong> {task.deviceInfo.model}
                                    </p>
                                    <p>
                                      <strong>Serial:</strong> {task.deviceInfo.serialNumber}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {task.ticketInfo && (
                                <div>
                                  <Label className="font-semibold">Ticket Information</Label>
                                  <div className="text-sm bg-muted p-2 rounded">
                                    <p>
                                      <strong>Ticket #:</strong> {task.ticketInfo.ticketNumber}
                                    </p>
                                    <p>
                                      <strong>Category:</strong> {task.ticketInfo.category}
                                    </p>
                                    <p>
                                      <strong>Subcategory:</strong> {task.ticketInfo.subcategory}
                                    </p>
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
                          <span>Progress: {Math.round((task.actualHours / task.estimatedHours) * 100)}%</span>
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
