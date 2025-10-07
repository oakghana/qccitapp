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
  Building2,
  Package,
  Truck,
  Timer,
  Phone,
  User,
  ClipboardCheck
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface ServiceProviderRepairTask {
  id: string
  taskNumber: string
  deviceInfo: {
    type: string
    brand: string
    model: string
    serialNumber: string
    assetTag: string
  }
  issueDescription: string
  priority: "low" | "medium" | "high" | "critical"
  status: "assigned" | "pickup_scheduled" | "collected" | "in_repair" | "completed" | "returned"
  assignedBy: {
    name: string
    role: string
    contact: string
  }
  assignedDate: string
  requestedPickupDate?: string
  scheduledPickupDate?: string
  collectedDate?: string
  estimatedCompletionDate?: string
  completedDate?: string
  returnedDate?: string
  
  // Service Provider Actions
  pickupNotes?: string
  repairNotes?: string
  partsUsed?: string[]
  laborHours?: number
  repairCost?: number
  
  // Location & Contact
  pickupLocation: string
  contactPerson: string
  contactPhone: string
  
  // Attachments
  attachments: string[]
  beforePhotos?: string[]
  afterPhotos?: string[]
  
  // History
  statusHistory: {
    status: string
    date: string
    notes: string
    updatedBy: string
  }[]
}

export function ServiceProviderTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<ServiceProviderRepairTask[]>([])
  const [selectedTask, setSelectedTask] = useState<ServiceProviderRepairTask | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [pickupNotes, setPickupNotes] = useState("")
  const [repairNotes, setRepairNotes] = useState("")
  const [laborHours, setLaborHours] = useState("")
  const [repairCost, setRepairCost] = useState("")

  useEffect(() => {
    // Mock data for service provider tasks
    const mockTasks: ServiceProviderRepairTask[] = [
      {
        id: "RPR-001",
        taskNumber: "QCC-RPR-2025-001",
        deviceInfo: {
          type: "Laptop",
          brand: "Dell",
          model: "Latitude 5520",
          serialNumber: "DL5520001",
          assetTag: "QCC-LAP-001"
        },
        issueDescription: "Screen flickering and keyboard keys not responding. System randomly freezes during operation.",
        priority: "high",
        status: "assigned",
        assignedBy: {
          name: "John Appiah",
          role: "IT Head",
          contact: "john.appiah@qcc.com.gh"
        },
        assignedDate: "2025-01-15T09:30:00Z",
        pickupLocation: "QCC Head Office - IT Department",
        contactPerson: "John Appiah",
        contactPhone: "+233 24 123 4567",
        attachments: ["device-photos.zip", "error-logs.txt"],
        statusHistory: [
          {
            status: "assigned",
            date: "2025-01-15T09:30:00Z",
            notes: "Task assigned to service provider for repair",
            updatedBy: "John Appiah"
          }
        ]
      },
      {
        id: "RPR-002",
        taskNumber: "QCC-RPR-2025-002",
        deviceInfo: {
          type: "Desktop",
          brand: "HP",
          model: "EliteDesk 800",
          serialNumber: "HP800015",
          assetTag: "QCC-DSK-015"
        },
        issueDescription: "System won't boot. Hard drive failure suspected. All data needs recovery if possible.",
        priority: "critical",
        status: "in_repair",
        assignedBy: {
          name: "John Appiah",
          role: "IT Head", 
          contact: "john.appiah@qcc.com.gh"
        },
        assignedDate: "2025-01-12T14:15:00Z",
        scheduledPickupDate: "2025-01-13T10:00:00Z",
        collectedDate: "2025-01-13T10:30:00Z",
        estimatedCompletionDate: "2025-01-18T17:00:00Z",
        pickupLocation: "QCC Head Office - IT Department",
        contactPerson: "John Appiah",
        contactPhone: "+233 24 123 4567",
        pickupNotes: "Device collected on schedule. Confirmed hard drive failure diagnosis.",
        repairNotes: "Replaced HDD with 500GB SSD. Data recovery in progress using specialized tools.",
        laborHours: 4.5,
        attachments: ["diagnostic-report.pdf", "data-recovery-log.xlsx"],
        statusHistory: [
          {
            status: "assigned",
            date: "2025-01-12T14:15:00Z",
            notes: "Critical repair task assigned",
            updatedBy: "John Appiah"
          },
          {
            status: "pickup_scheduled",
            date: "2025-01-12T16:20:00Z",
            notes: "Pickup scheduled for next day at 10:00 AM",
            updatedBy: "Natland IT Services"
          },
          {
            status: "collected",
            date: "2025-01-13T10:30:00Z",
            notes: "Device collected successfully. Hard drive failure confirmed.",
            updatedBy: "Natland IT Services"
          },
          {
            status: "in_repair",
            date: "2025-01-13T14:00:00Z",
            notes: "Started repair process. Data recovery initiated.",
            updatedBy: "Natland IT Services"
          }
        ]
      },
      {
        id: "RPR-003",
        taskNumber: "QCC-RPR-2025-003",
        deviceInfo: {
          type: "Printer",
          brand: "Canon",
          model: "ImageRunner 2530i",
          serialNumber: "CR2530008",
          assetTag: "QCC-PRT-008"
        },
        issueDescription: "Frequent paper jams and poor print quality. Toner streaking on documents.",
        priority: "medium",
        status: "completed",
        assignedBy: {
          name: "John Appiah",
          role: "IT Head",
          contact: "john.appiah@qcc.com.gh"
        },
        assignedDate: "2025-01-08T11:00:00Z",
        scheduledPickupDate: "2025-01-09T14:00:00Z",
        collectedDate: "2025-01-09T14:15:00Z",
        completedDate: "2025-01-11T16:30:00Z",
        pickupLocation: "QCC Head Office - IT Department",
        contactPerson: "John Appiah",
        contactPhone: "+233 24 123 4567",
        pickupNotes: "Printer collected. Multiple paper jam issues observed.",
        repairNotes: "Cleaned all paper feed rollers, replaced toner cartridge, calibrated print heads, performed full maintenance cycle.",
        partsUsed: ["Toner Cartridge", "Paper Feed Roller", "Cleaning Kit"],
        laborHours: 2.5,
        repairCost: 280.00,
        attachments: ["repair-checklist.pdf", "parts-invoice.pdf"],
        beforePhotos: ["before-1.jpg", "before-2.jpg"],
        afterPhotos: ["after-1.jpg", "after-2.jpg"],
        statusHistory: [
          {
            status: "assigned",
            date: "2025-01-08T11:00:00Z",
            notes: "Printer maintenance task assigned",
            updatedBy: "John Appiah"
          },
          {
            status: "pickup_scheduled",
            date: "2025-01-08T15:45:00Z",
            notes: "Pickup scheduled for tomorrow afternoon",
            updatedBy: "Natland IT Services"
          },
          {
            status: "collected",
            date: "2025-01-09T14:15:00Z",
            notes: "Printer collected for maintenance",
            updatedBy: "Natland IT Services"
          },
          {
            status: "in_repair",
            date: "2025-01-09T16:00:00Z",
            notes: "Started comprehensive maintenance procedure",
            updatedBy: "Natland IT Services"
          },
          {
            status: "completed",
            date: "2025-01-11T16:30:00Z",
            notes: "Repair completed. Ready for return delivery.",
            updatedBy: "Natland IT Services"
          }
        ]
      }
    ]
    
    setTasks(mockTasks)
  }, [])

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true
    return task.status === filter
  })

  const updateTaskStatus = (taskId: string, newStatus: ServiceProviderRepairTask["status"], notes: string = "") => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? {
              ...task,
              status: newStatus,
              ...(newStatus === "pickup_scheduled" && scheduledDate && scheduledTime ? {
                scheduledPickupDate: `${scheduledDate}T${scheduledTime}:00Z`
              } : {}),
              ...(newStatus === "collected" ? {
                collectedDate: new Date().toISOString()
              } : {}),
              ...(newStatus === "completed" ? {
                completedDate: new Date().toISOString()
              } : {}),
              statusHistory: [
                ...task.statusHistory,
                {
                  status: newStatus,
                  date: new Date().toISOString(),
                  notes: notes || `Status updated to ${newStatus.replace('_', ' ')}`,
                  updatedBy: user?.name || "Service Provider"
                }
              ]
            }
          : task
      )
    )
  }

  const handleSchedulePickup = () => {
    if (selectedTask && scheduledDate && scheduledTime) {
      updateTaskStatus(selectedTask.id, "pickup_scheduled", `Pickup scheduled for ${scheduledDate} at ${scheduledTime}. ${pickupNotes}`)
      setSelectedTask(null)
      setScheduledDate("")
      setScheduledTime("")
      setPickupNotes("")
    }
  }

  const handleCompleteRepair = () => {
    if (selectedTask) {
      const updatedTask = {
        ...selectedTask,
        repairNotes,
        laborHours: laborHours ? parseFloat(laborHours) : undefined,
        repairCost: repairCost ? parseFloat(repairCost) : undefined
      }
      
      setTasks(prev => 
        prev.map(task => 
          task.id === selectedTask.id ? updatedTask : task
        )
      )
      
      updateTaskStatus(selectedTask.id, "completed", `Repair completed. ${repairNotes}`)
      setSelectedTask(null)
      setRepairNotes("")
      setLaborHours("")
      setRepairCost("")
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
      case "pickup_scheduled": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
      case "collected": return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300"
      case "in_repair": return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300"
      case "completed": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300"
      case "returned": return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
      default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Service Provider Branding */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-lime-600 to-green-700 flex items-center justify-center shadow-lg">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Repair Tasks</h1>
            <p className="text-muted-foreground">
              Assigned repair tasks from QCC IT Department • {user?.name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="bg-lime-50 text-lime-700 border-lime-200">
            QCC Authorized Service Provider
          </Badge>
        </div>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Assigned
            </CardTitle>
            <div className="text-2xl font-bold">{tasks.filter(t => t.status === "assigned").length}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled
            </CardTitle>
            <div className="text-2xl font-bold">{tasks.filter(t => t.status === "pickup_scheduled").length}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              In Repair
            </CardTitle>
            <div className="text-2xl font-bold">{tasks.filter(t => ["collected", "in_repair"].includes(t.status)).length}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
            </CardTitle>
            <div className="text-2xl font-bold">{tasks.filter(t => ["completed", "returned"].includes(t.status)).length}</div>
          </CardHeader>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Filter Tasks</CardTitle>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="pickup_scheduled">Pickup Scheduled</SelectItem>
                <SelectItem value="collected">Collected</SelectItem>
                <SelectItem value="in_repair">In Repair</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Tasks List */}
      <div className="grid gap-6">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{task.taskNumber}</CardTitle>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">{task.deviceInfo.type} - {task.deviceInfo.brand} {task.deviceInfo.model}</p>
                      <p className="text-muted-foreground">Serial: {task.deviceInfo.serialNumber}</p>
                      <p className="text-muted-foreground">Asset: {task.deviceInfo.assetTag}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="h-3 w-3" />
                        <span>{task.pickupLocation}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3 w-3" />
                        <span>{task.contactPerson}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{task.contactPhone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {task.status === "assigned" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-lime-600 to-green-700 hover:from-lime-700 hover:to-green-800 text-white"
                          onClick={() => setSelectedTask(task)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Pickup
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Schedule Device Pickup</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="pickupDate">Pickup Date</Label>
                              <Input
                                id="pickupDate"
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="pickupTime">Pickup Time</Label>
                              <Input
                                id="pickupTime"
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="pickupNotes">Notes (Optional)</Label>
                            <Textarea
                              id="pickupNotes"
                              placeholder="Any special instructions or requirements..."
                              value={pickupNotes}
                              onChange={(e) => setPickupNotes(e.target.value)}
                            />
                          </div>
                          <Button 
                            onClick={handleSchedulePickup} 
                            className="w-full bg-gradient-to-r from-lime-600 to-green-700 hover:from-lime-700 hover:to-green-800 text-white"
                          >
                            Confirm Pickup Schedule
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {task.status === "pickup_scheduled" && (
                    <Button 
                      size="sm" 
                      onClick={() => updateTaskStatus(task.id, "collected", "Device collected successfully")}
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Mark as Collected
                    </Button>
                  )}
                  
                  {task.status === "collected" && (
                    <Button 
                      size="sm" 
                      onClick={() => updateTaskStatus(task.id, "in_repair", "Repair work started")}
                      className="bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white"
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Start Repair
                    </Button>
                  )}
                  
                  {task.status === "in_repair" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedTask(task)}
                          className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Complete Repair
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Complete Repair</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="repairNotes">Repair Details</Label>
                            <Textarea
                              id="repairNotes"
                              placeholder="Describe the work performed, parts replaced, etc..."
                              value={repairNotes}
                              onChange={(e) => setRepairNotes(e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="laborHours">Labor Hours</Label>
                              <Input
                                id="laborHours"
                                type="number"
                                step="0.5"
                                placeholder="0.0"
                                value={laborHours}
                                onChange={(e) => setLaborHours(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="repairCost">Total Cost (GHS)</Label>
                              <Input
                                id="repairCost"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={repairCost}
                                onChange={(e) => setRepairCost(e.target.value)}
                              />
                            </div>
                          </div>
                          <Button 
                            onClick={handleCompleteRepair} 
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white"
                          >
                            Mark as Completed
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Wrench className="h-5 w-5" />
                          {task.taskNumber} - Repair Details
                        </DialogTitle>
                      </DialogHeader>
                      <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="details">Task Details</TabsTrigger>
                          <TabsTrigger value="progress">Progress</TabsTrigger>
                          <TabsTrigger value="history">Status History</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="details" className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <Label className="font-semibold">Device Information</Label>
                                <div className="bg-muted p-3 rounded-lg space-y-1">
                                  <p><strong>Type:</strong> {task.deviceInfo.type}</p>
                                  <p><strong>Brand:</strong> {task.deviceInfo.brand}</p>
                                  <p><strong>Model:</strong> {task.deviceInfo.model}</p>
                                  <p><strong>Serial:</strong> {task.deviceInfo.serialNumber}</p>
                                  <p><strong>Asset Tag:</strong> {task.deviceInfo.assetTag}</p>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="font-semibold">Issue Description</Label>
                                <p className="text-sm bg-muted p-3 rounded-lg">{task.issueDescription}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <Label className="font-semibold">Contact Information</Label>
                                <div className="bg-muted p-3 rounded-lg space-y-1">
                                  <p><strong>Assigned By:</strong> {task.assignedBy.name}</p>
                                  <p><strong>Role:</strong> {task.assignedBy.role}</p>
                                  <p><strong>Contact:</strong> {task.assignedBy.contact}</p>
                                  <p><strong>Phone:</strong> {task.contactPhone}</p>
                                  <p><strong>Location:</strong> {task.pickupLocation}</p>
                                </div>
                              </div>
                              
                              {task.repairNotes && (
                                <div>
                                  <Label className="font-semibold">Repair Notes</Label>
                                  <p className="text-sm bg-muted p-3 rounded-lg">{task.repairNotes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="progress" className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <Label className="font-semibold">Timeline</Label>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Assigned:</span>
                                  <span>{new Date(task.assignedDate).toLocaleString()}</span>
                                </div>
                                {task.scheduledPickupDate && (
                                  <div className="flex justify-between text-sm">
                                    <span>Scheduled Pickup:</span>
                                    <span>{new Date(task.scheduledPickupDate).toLocaleString()}</span>
                                  </div>
                                )}
                                {task.collectedDate && (
                                  <div className="flex justify-between text-sm">
                                    <span>Collected:</span>
                                    <span>{new Date(task.collectedDate).toLocaleString()}</span>
                                  </div>
                                )}
                                {task.completedDate && (
                                  <div className="flex justify-between text-sm">
                                    <span>Completed:</span>
                                    <span>{new Date(task.completedDate).toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {(task.laborHours || task.repairCost) && (
                              <div>
                                <Label className="font-semibold">Repair Summary</Label>
                                <div className="space-y-2">
                                  {task.laborHours && (
                                    <div className="flex justify-between text-sm">
                                      <span>Labor Hours:</span>
                                      <span>{task.laborHours}h</span>
                                    </div>
                                  )}
                                  {task.repairCost && (
                                    <div className="flex justify-between text-sm">
                                      <span>Total Cost:</span>
                                      <span>GHS {task.repairCost}</span>
                                    </div>
                                  )}
                                  {task.partsUsed && (
                                    <div>
                                      <span className="text-sm">Parts Used:</span>
                                      <ul className="text-sm list-disc list-inside ml-4">
                                        {task.partsUsed.map((part, index) => (
                                          <li key={index}>{part}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="history" className="space-y-4">
                          <div>
                            <Label className="font-semibold">Status History</Label>
                            <div className="space-y-3 mt-2">
                              {task.statusHistory.map((entry, index) => (
                                <div key={index} className="border-l-2 border-primary pl-4 pb-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium capitalize">{entry.status.replace('_', ' ')}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(entry.date).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{entry.notes}</p>
                                  <p className="text-xs text-muted-foreground">Updated by: {entry.updatedBy}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{task.issueDescription}</p>
              
              {task.scheduledPickupDate && task.status === "pickup_scheduled" && (
                <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Timer className="h-4 w-4" />
                    <span className="font-medium">Pickup Scheduled</span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {new Date(task.scheduledPickupDate).toLocaleString()}
                  </p>
                </div>
              )}
              
              {task.repairNotes && task.status === "in_repair" && (
                <div className="bg-orange-50 dark:bg-orange-950/50 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <Wrench className="h-4 w-4" />
                    <span className="font-medium">Repair in Progress</span>
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">{task.repairNotes}</p>
                </div>
              )}
              
              {task.status === "completed" && (
                <div className="bg-green-50 dark:bg-green-950/50 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Repair Completed - Ready for Return</span>
                  </div>
                  {task.repairCost && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Total Cost: GHS {task.repairCost}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tasks Found</h3>
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
