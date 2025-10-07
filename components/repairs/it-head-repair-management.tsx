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
  Plus, 
  Send, 
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
  ClipboardCheck,
  Search,
  Filter,
  Download,
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface Device {
  id: string
  type: string
  brand: string
  model: string
  serialNumber: string
  assetTag: string
  location: string
  assignedTo: string
  status: "active" | "maintenance" | "faulty" | "retired"
}

interface ServiceProvider {
  id: string
  name: string
  company: string
  specialization: string[]
  contact: string
  email: string
  rating: number
  status: "active" | "busy" | "unavailable"
}

interface RepairTask {
  id: string
  taskNumber: string
  device: Device
  issueDescription: string
  priority: "low" | "medium" | "high" | "critical"
  status: "draft" | "assigned" | "pickup_scheduled" | "collected" | "in_repair" | "completed" | "returned" | "cancelled"
  serviceProvider?: ServiceProvider
  createdBy: string
  createdDate: string
  estimatedCost?: number
  actualCost?: number
  pickupDate?: string
  completionDate?: string
  repairNotes?: string
  laborHours?: number
  partsUsed?: string[]
  attachments: string[]
}

export function ITHeadRepairManagement() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<RepairTask[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  
  // Form states
  const [selectedDevice, setSelectedDevice] = useState("")
  const [issueDescription, setIssueDescription] = useState("")
  const [priority, setPriority] = useState<RepairTask["priority"]>("medium")
  const [selectedProvider, setSelectedProvider] = useState("")
  const [estimatedCost, setEstimatedCost] = useState("")

  useEffect(() => {
    // Mock data
    const mockDevices: Device[] = [
      {
        id: "DEV-001",
        type: "Laptop",
        brand: "Dell",
        model: "Latitude 5520",
        serialNumber: "DL5520001",
        assetTag: "QCC-LAP-001",
        location: "Finance Department",
        assignedTo: "Mary Asante",
        status: "faulty"
      },
      {
        id: "DEV-002",
        type: "Desktop",
        brand: "HP",
        model: "EliteDesk 800",
        serialNumber: "HP800015",
        assetTag: "QCC-DSK-015",
        location: "HR Department",
        assignedTo: "Samuel Osei",
        status: "faulty"
      },
      {
        id: "DEV-003",
        type: "Printer",
        brand: "Canon",
        model: "ImageRunner 2530i",
        serialNumber: "CR2530008",
        assetTag: "QCC-PRT-008",
        location: "Marketing Department",
        assignedTo: "Department Shared",
        status: "maintenance"
      }
    ]

    const mockProviders: ServiceProvider[] = [
      {
        id: "SP-001",
        name: "Natland IT Services",
        company: "Natland Technology Ltd",
        specialization: ["Laptops", "Desktops", "Servers", "Networking"],
        contact: "+233 24 567 8901",
        email: "service@natlandtech.com.gh",
        rating: 4.8,
        status: "active"
      },
      {
        id: "SP-002", 
        name: "TechFix Ghana",
        company: "TechFix Solutions",
        specialization: ["Printers", "Scanners", "Projectors"],
        contact: "+233 20 123 4567",
        email: "repairs@techfixgh.com",
        rating: 4.5,
        status: "active"
      }
    ]

    const mockTasks: RepairTask[] = [
      {
        id: "RPR-001",
        taskNumber: "QCC-RPR-2025-001",
        device: mockDevices[0],
        issueDescription: "Screen flickering and keyboard keys not responding. System randomly freezes during operation.",
        priority: "high",
        status: "in_repair",
        serviceProvider: mockProviders[0],
        createdBy: user?.name || "IT Head",
        createdDate: "2025-01-15T09:30:00Z",
        estimatedCost: 350.00,
        actualCost: 320.00,
        pickupDate: "2025-01-16T10:00:00Z",
        repairNotes: "Replaced keyboard and LCD panel. System tested and stable.",
        laborHours: 3.5,
        partsUsed: ["Keyboard Assembly", "LCD Panel"],
        attachments: ["device-photos.zip", "diagnostic-report.pdf"]
      },
      {
        id: "RPR-002",
        taskNumber: "QCC-RPR-2025-002", 
        device: mockDevices[1],
        issueDescription: "System won't boot. Hard drive failure suspected. Data recovery required.",
        priority: "critical",
        status: "completed",
        serviceProvider: mockProviders[0],
        createdBy: user?.name || "IT Head",
        createdDate: "2025-01-12T14:15:00Z",
        estimatedCost: 500.00,
        actualCost: 480.00,
        pickupDate: "2025-01-13T10:00:00Z",
        completionDate: "2025-01-18T16:30:00Z",
        repairNotes: "Replaced HDD with SSD. Successfully recovered all data. System performance improved significantly.",
        laborHours: 6.0,
        partsUsed: ["500GB SSD", "SATA Cable"],
        attachments: ["data-recovery-report.pdf", "performance-test.xlsx"]
      }
    ]

    setDevices(mockDevices)
    setServiceProviders(mockProviders)
    setTasks(mockTasks)
  }, [user])

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.taskNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.device.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.device.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.issueDescription.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const createRepairTask = () => {
    if (!selectedDevice || !issueDescription || !selectedProvider) return

    const device = devices.find(d => d.id === selectedDevice)
    const provider = serviceProviders.find(p => p.id === selectedProvider)
    
    if (!device || !provider) return

    const newTask: RepairTask = {
      id: `RPR-${String(tasks.length + 1).padStart(3, '0')}`,
      taskNumber: `QCC-RPR-2025-${String(tasks.length + 1).padStart(3, '0')}`,
      device,
      issueDescription,
      priority,
      status: "assigned",
      serviceProvider: provider,
      createdBy: user?.name || "IT Head",
      createdDate: new Date().toISOString(),
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      attachments: []
    }

    setTasks(prev => [...prev, newTask])
    
    // Reset form
    setSelectedDevice("")
    setIssueDescription("")
    setPriority("medium")
    setSelectedProvider("")
    setEstimatedCost("")
    setShowCreateDialog(false)
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
      case "draft": return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
      case "assigned": return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300"
      case "pickup_scheduled": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
      case "collected": return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300"
      case "in_repair": return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300"
      case "completed": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300"
      case "returned": return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300"
      case "cancelled": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300"
      default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getTaskStats = () => {
    const stats = {
      total: tasks.length,
      active: tasks.filter(t => !["completed", "returned", "cancelled"].includes(t.status)).length,
      completed: tasks.filter(t => t.status === "completed" || t.status === "returned").length,
      overdue: tasks.filter(t => {
        if (!t.pickupDate) return false
        const pickupDate = new Date(t.pickupDate)
        const now = new Date()
        return pickupDate < now && !["completed", "returned"].includes(t.status)
      }).length,
      totalCost: tasks.reduce((sum, t) => sum + (t.actualCost || t.estimatedCost || 0), 0),
      avgRepairTime: tasks.filter(t => t.completionDate && t.pickupDate).reduce((sum, t) => {
        const pickup = new Date(t.pickupDate!)
        const completion = new Date(t.completionDate!)
        return sum + (completion.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)
      }, 0) / tasks.filter(t => t.completionDate && t.pickupDate).length || 0
    }
    return stats
  }

  const stats = getTaskStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
            <Wrench className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Repair Management</h1>
            <p className="text-muted-foreground">
              Manage device repairs and service provider assignments • {user?.name}
            </p>
          </div>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Repair Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Repair Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="device">Select Device</Label>
                  <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose device to repair" />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.filter(d => d.status === "faulty" || d.status === "maintenance").map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.assetTag} - {device.type} ({device.brand} {device.model})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="provider">Service Provider</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose service provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceProviders.filter(p => p.status === "active").map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name} - {provider.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="issue">Issue Description</Label>
                <Textarea
                  id="issue"
                  placeholder="Describe the problem with the device..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  rows={4}
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={priority} onValueChange={(value) => setPriority(value as RepairTask["priority"])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="critical">Critical Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="cost">Estimated Cost (GHS)</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createRepairTask}
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Assign Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Tasks
            </CardTitle>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active
            </CardTitle>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
            </CardTitle>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Overdue
            </CardTitle>
            <div className="text-2xl font-bold">{stats.overdue}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Cost
            </CardTitle>
            <div className="text-xl font-bold">GHS {stats.totalCost.toFixed(2)}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Timer className="h-4 w-4" />
              Avg Repair Time
            </CardTitle>
            <div className="text-xl font-bold">{stats.avgRepairTime.toFixed(1)} days</div>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks, devices, or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="pickup_scheduled">Pickup Scheduled</SelectItem>
                  <SelectItem value="collected">Collected</SelectItem>
                  <SelectItem value="in_repair">In Repair</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
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

      {/* Tasks List */}
      <div className="space-y-4">
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
                  
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium">{task.device.type} - {task.device.brand} {task.device.model}</p>
                      <p className="text-muted-foreground">Asset: {task.device.assetTag}</p>
                      <p className="text-muted-foreground">User: {task.device.assignedTo}</p>
                    </div>
                    <div>
                      <p className="font-medium">Service Provider</p>
                      <p className="text-muted-foreground">{task.serviceProvider?.name}</p>
                      <p className="text-muted-foreground">{task.serviceProvider?.company}</p>
                    </div>
                    <div>
                      <p className="font-medium">Cost Information</p>
                      <p className="text-muted-foreground">
                        Estimated: GHS {task.estimatedCost?.toFixed(2) || "N/A"}
                      </p>
                      {task.actualCost && (
                        <p className="text-muted-foreground">
                          Actual: GHS {task.actualCost.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
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
                          {task.taskNumber} - Repair Task Details
                        </DialogTitle>
                      </DialogHeader>
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="device">Device Info</TabsTrigger>
                          <TabsTrigger value="provider">Service Provider</TabsTrigger>
                          <TabsTrigger value="progress">Progress</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="overview" className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <Label className="font-semibold">Task Information</Label>
                                <div className="bg-muted p-3 rounded-lg space-y-1">
                                  <p><strong>Task Number:</strong> {task.taskNumber}</p>
                                  <p><strong>Created By:</strong> {task.createdBy}</p>
                                  <p><strong>Created Date:</strong> {new Date(task.createdDate).toLocaleString()}</p>
                                  <p><strong>Priority:</strong> <Badge className={getPriorityColor(task.priority)} size="sm">{task.priority}</Badge></p>
                                  <p><strong>Status:</strong> <Badge className={getStatusColor(task.status)} size="sm">{task.status}</Badge></p>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="font-semibold">Issue Description</Label>
                                <p className="text-sm bg-muted p-3 rounded-lg">{task.issueDescription}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <Label className="font-semibold">Cost Analysis</Label>
                                <div className="bg-muted p-3 rounded-lg space-y-1">
                                  <p><strong>Estimated Cost:</strong> GHS {task.estimatedCost?.toFixed(2) || "Not specified"}</p>
                                  {task.actualCost && (
                                    <p><strong>Actual Cost:</strong> GHS {task.actualCost.toFixed(2)}</p>
                                  )}
                                  {task.laborHours && (
                                    <p><strong>Labor Hours:</strong> {task.laborHours}h</p>
                                  )}
                                  {task.partsUsed && task.partsUsed.length > 0 && (
                                    <div>
                                      <p><strong>Parts Used:</strong></p>
                                      <ul className="list-disc list-inside ml-4 text-sm">
                                        {task.partsUsed.map((part, index) => (
                                          <li key={index}>{part}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
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
                        
                        <TabsContent value="device" className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <h3 className="font-semibold mb-3">Device Information</h3>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <p><strong>Type:</strong> {task.device.type}</p>
                                <p><strong>Brand:</strong> {task.device.brand}</p>
                                <p><strong>Model:</strong> {task.device.model}</p>
                                <p><strong>Serial Number:</strong> {task.device.serialNumber}</p>
                              </div>
                              <div className="space-y-2">
                                <p><strong>Asset Tag:</strong> {task.device.assetTag}</p>
                                <p><strong>Location:</strong> {task.device.location}</p>
                                <p><strong>Assigned To:</strong> {task.device.assignedTo}</p>
                                <p><strong>Status:</strong> <Badge size="sm">{task.device.status}</Badge></p>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="provider" className="space-y-4">
                          {task.serviceProvider && (
                            <div className="bg-muted p-4 rounded-lg">
                              <h3 className="font-semibold mb-3">Service Provider Details</h3>
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                  <p><strong>Name:</strong> {task.serviceProvider.name}</p>
                                  <p><strong>Company:</strong> {task.serviceProvider.company}</p>
                                  <p><strong>Contact:</strong> {task.serviceProvider.contact}</p>
                                  <p><strong>Email:</strong> {task.serviceProvider.email}</p>
                                </div>
                                <div className="space-y-2">
                                  <p><strong>Rating:</strong> ⭐ {task.serviceProvider.rating}/5.0</p>
                                  <p><strong>Status:</strong> <Badge size="sm">{task.serviceProvider.status}</Badge></p>
                                  <div>
                                    <p><strong>Specialization:</strong></p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {task.serviceProvider.specialization.map((spec, index) => (
                                        <Badge key={index} variant="outline" size="sm">{spec}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="progress" className="space-y-4">
                          <div className="space-y-4">
                            <div>
                              <Label className="font-semibold">Timeline</Label>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Created:</span>
                                  <span>{new Date(task.createdDate).toLocaleString()}</span>
                                </div>
                                {task.pickupDate && (
                                  <div className="flex justify-between text-sm">
                                    <span>Pickup Date:</span>
                                    <span>{new Date(task.pickupDate).toLocaleString()}</span>
                                  </div>
                                )}
                                {task.completionDate && (
                                  <div className="flex justify-between text-sm">
                                    <span>Completed:</span>
                                    <span>{new Date(task.completionDate).toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {task.attachments.length > 0 && (
                              <div>
                                <Label className="font-semibold">Attachments</Label>
                                <div className="space-y-2">
                                  {task.attachments.map((attachment, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm">
                                      <FileText className="h-4 w-4" />
                                      <span>{attachment}</span>
                                      <Button size="sm" variant="ghost">
                                        <Download className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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
              
              {task.status === "assigned" && (
                <div className="bg-purple-50 dark:bg-purple-950/50 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Send className="h-4 w-4" />
                    <span className="font-medium">Task Assigned to Service Provider</span>
                  </div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                    Waiting for pickup scheduling by {task.serviceProvider?.name}
                  </p>
                </div>
              )}
              
              {task.status === "in_repair" && (
                <div className="bg-orange-50 dark:bg-orange-950/50 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <Wrench className="h-4 w-4" />
                    <span className="font-medium">Currently Under Repair</span>
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                    Device is being repaired by {task.serviceProvider?.name}
                  </p>
                </div>
              )}
              
              {task.status === "completed" && (
                <div className="bg-green-50 dark:bg-green-950/50 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Repair Completed</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Ready for pickup from {task.serviceProvider?.name} • Cost: GHS {task.actualCost?.toFixed(2) || task.estimatedCost?.toFixed(2) || "TBD"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Wrench className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Repair Tasks Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" || priorityFilter !== "all" 
                ? "Try adjusting your filters or search terms." 
                : "No repair tasks have been created yet."}
            </p>
            {!searchTerm && statusFilter === "all" && priorityFilter === "all" && (
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Repair Task
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
