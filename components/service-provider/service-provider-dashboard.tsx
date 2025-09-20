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
import { Clock, MapPin, Wrench, CheckCircle, AlertCircle, FileText, Calendar } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface RepairTask {
  id: string
  deviceId: string
  deviceType: string
  deviceModel: string
  serialNumber: string
  issue: string
  priority: "low" | "medium" | "high" | "critical"
  status: "assigned" | "picked_up" | "in_progress" | "completed" | "ready_for_return"
  assignedDate: string
  dueDate: string
  location: string
  requestedBy: string
  description: string
  attachments: string[]
  serviceNotes?: string
  completionDate?: string
  estimatedCost?: number
  pickedUpDate?: string
  expectedReturnDate?: string
}

export function ServiceProviderDashboard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<RepairTask[]>([])
  const [selectedTask, setSelectedTask] = useState<RepairTask | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [serviceNotes, setServiceNotes] = useState("")
  const [estimatedCost, setEstimatedCost] = useState("")
  const [expectedReturnDate, setExpectedReturnDate] = useState("")

  useEffect(() => {
    const mockTasks: RepairTask[] = [
      {
        id: "REP-001",
        deviceId: "DEV-001",
        deviceType: "Laptop",
        deviceModel: "Dell Latitude 5520",
        serialNumber: "DL5520001",
        issue: "Screen flickering and keyboard malfunction",
        priority: "high",
        status: "assigned",
        assignedDate: "2024-01-15",
        dueDate: "2024-01-29",
        location: "Head Office",
        requestedBy: "John Mensah",
        description:
          "Laptop screen flickers intermittently and some keyboard keys are not responding. Device needs immediate attention as it's affecting productivity.",
        attachments: ["repair-form-001.pdf", "device-photos.zip"],
      },
      {
        id: "REP-002",
        deviceId: "DEV-015",
        deviceType: "Desktop",
        deviceModel: "HP EliteDesk 800",
        serialNumber: "HP800015",
        issue: "System won't boot, possible hard drive failure",
        priority: "critical",
        status: "in_progress",
        assignedDate: "2024-01-12",
        dueDate: "2024-01-26",
        location: "Kumasi Office",
        requestedBy: "Akosua Asante",
        description:
          "Desktop computer fails to boot. System shows hard drive error messages. All data needs to be recovered if possible.",
        attachments: ["repair-form-002.pdf", "error-logs.txt"],
        serviceNotes: "Diagnosed hard drive failure. Ordered replacement SSD. Data recovery in progress.",
        pickedUpDate: "2024-01-13",
        expectedReturnDate: "2024-01-25",
      },
      {
        id: "REP-003",
        deviceId: "DEV-008",
        deviceType: "Printer",
        deviceModel: "Canon ImageRunner 2530i",
        serialNumber: "CR2530008",
        issue: "Paper jam and print quality issues",
        priority: "medium",
        status: "ready_for_return",
        assignedDate: "2024-01-08",
        dueDate: "2024-01-22",
        location: "Head Office",
        requestedBy: "IT Department",
        description:
          "Printer frequently jams and produces poor quality prints. Needs thorough cleaning and maintenance.",
        attachments: ["repair-form-003.pdf"],
        serviceNotes: "Cleaned all rollers, replaced toner cartridge, calibrated print heads. Tested successfully.",
        completionDate: "2024-01-14",
        estimatedCost: 150,
        pickedUpDate: "2024-01-09",
        expectedReturnDate: "2024-01-16",
      },
    ]
    setTasks(mockTasks)
  }, [])

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true
    return task.status === filter
  })

  const updateTaskStatus = (
    taskId: string,
    status: RepairTask["status"],
    notes?: string,
    cost?: number,
    returnDate?: string,
  ) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              serviceNotes: notes || task.serviceNotes,
              estimatedCost: cost || task.estimatedCost,
              expectedReturnDate: returnDate || task.expectedReturnDate,
              completionDate:
                status === "completed" || status === "ready_for_return"
                  ? new Date().toISOString().split("T")[0]
                  : task.completionDate,
              pickedUpDate: status === "picked_up" ? new Date().toISOString().split("T")[0] : task.pickedUpDate,
            }
          : task,
      ),
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "picked_up":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "completed":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "ready_for_return":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handlePickupDevice = (task: RepairTask) => {
    updateTaskStatus(task.id, "picked_up")
  }

  const handleStartWork = (task: RepairTask) => {
    updateTaskStatus(task.id, "in_progress")
  }

  const handleCompleteWork = () => {
    if (selectedTask) {
      updateTaskStatus(
        selectedTask.id,
        "ready_for_return",
        serviceNotes,
        estimatedCost ? Number.parseFloat(estimatedCost) : undefined,
        expectedReturnDate,
      )
      setSelectedTask(null)
      setServiceNotes("")
      setEstimatedCost("")
      setExpectedReturnDate("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Natland Repairs Dashboard</h1>
          <p className="text-muted-foreground">Manage your assigned device repairs and returns</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="ready_for_return">Ready for Return</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter((t) => t.status === "in_progress").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Return</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter((t) => t.status === "ready_for_return").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter((t) => new Date(t.dueDate) < new Date() && !["ready_for_return"].includes(t.status)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <div className="grid gap-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {task.deviceType} - {task.deviceModel}
                    </CardTitle>
                    <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                    <Badge className={getStatusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {task.location}
                    </span>
                    <span>Serial: {task.serialNumber}</span>
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    {task.expectedReturnDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Return: {new Date(task.expectedReturnDate).toLocaleDateString()}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {task.status === "assigned" && (
                    <Button onClick={() => handlePickupDevice(task)} size="sm">
                      Pick Up Device
                    </Button>
                  )}
                  {task.status === "picked_up" && (
                    <Button onClick={() => handleStartWork(task)} size="sm">
                      Start Repair
                    </Button>
                  )}
                  {task.status === "in_progress" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedTask(task)} size="sm">
                          Mark Complete
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Complete Repair Task</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="serviceNotes">Service Notes</Label>
                            <Textarea
                              id="serviceNotes"
                              placeholder="Describe the work performed..."
                              value={serviceNotes}
                              onChange={(e) => setServiceNotes(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="estimatedCost">Repair Cost (GHS)</Label>
                            <Input
                              id="estimatedCost"
                              type="number"
                              placeholder="0.00"
                              value={estimatedCost}
                              onChange={(e) => setEstimatedCost(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="expectedReturnDate">Expected Return Date</Label>
                            <Input
                              id="expectedReturnDate"
                              type="date"
                              value={expectedReturnDate}
                              onChange={(e) => setExpectedReturnDate(e.target.value)}
                            />
                          </div>
                          <Button onClick={handleCompleteWork} className="w-full">
                            Mark Ready for Return
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Repair Task Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="font-semibold">Device</Label>
                            <p>
                              {task.deviceType} - {task.deviceModel}
                            </p>
                          </div>
                          <div>
                            <Label className="font-semibold">Serial Number</Label>
                            <p>{task.serialNumber}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Location</Label>
                            <p>{task.location}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Requested By</Label>
                            <p>{task.requestedBy}</p>
                          </div>
                          {task.pickedUpDate && (
                            <div>
                              <Label className="font-semibold">Picked Up Date</Label>
                              <p>{new Date(task.pickedUpDate).toLocaleDateString()}</p>
                            </div>
                          )}
                          {task.expectedReturnDate && (
                            <div>
                              <Label className="font-semibold">Expected Return</Label>
                              <p>{new Date(task.expectedReturnDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label className="font-semibold">Issue Description</Label>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                        {task.serviceNotes && (
                          <div>
                            <Label className="font-semibold">Service Notes</Label>
                            <p className="text-sm text-muted-foreground">{task.serviceNotes}</p>
                          </div>
                        )}
                        {task.estimatedCost && (
                          <div>
                            <Label className="font-semibold">Repair Cost</Label>
                            <p className="text-sm text-muted-foreground">GHS {task.estimatedCost}</p>
                          </div>
                        )}
                        {task.attachments.length > 0 && (
                          <div>
                            <Label className="font-semibold">Attachments</Label>
                            <div className="flex gap-2 mt-2">
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
              <p className="text-sm text-muted-foreground">{task.issue}</p>
              {task.serviceNotes && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="text-sm">
                    <strong>Service Notes:</strong> {task.serviceNotes}
                  </p>
                </div>
              )}
              {task.expectedReturnDate && (
                <div className="mt-2 p-2 bg-primary/5 rounded border border-primary/20">
                  <p className="text-sm text-primary">
                    <strong>Expected Return:</strong> {new Date(task.expectedReturnDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No repair tasks found</h3>
            <p className="text-muted-foreground">
              {filter === "all"
                ? "You have no assigned repair tasks at the moment."
                : `No tasks with status "${filter}".`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
