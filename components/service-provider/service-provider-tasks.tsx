"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@supabase/supabase-js"
import {
  Clock,
  MapPin,
  Wrench,
  CheckCircle,
  FileText,
  Calendar,
  Package,
  Truck,
  Timer,
  Phone,
  User,
  Download,
  Upload,
  DollarSign,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

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

  // Invoice
  invoice?: {
    id: string
    file_url: string
    status: "pending" | "approved" | "rejected"
    total_amount: number
    invoice_number: string
    created_at: string
  }
}

const supabaseUrl = "https://your-supabase-url.supabase.co"
const supabaseKey = "your-supabase-key"
const supabase = createClient(supabaseUrl, supabaseKey)

export function ServiceProviderTasks() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<ServiceProviderRepairTask[]>([])
  const [selectedTask, setSelectedTask] = useState<ServiceProviderRepairTask | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [pickupNotes, setPickupNotes] = useState("")
  const [repairNotes, setRepairNotes] = useState("")
  const [laborHours, setLaborHours] = useState("")
  const [repairCost, setRepairCost] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [invoiceDate, setInvoiceDate] = useState("")
  const [invoiceLaborCost, setInvoiceLaborCost] = useState("")
  const [invoicePartsCost, setInvoicePartsCost] = useState("")
  const [invoiceOtherCharges, setInvoiceOtherCharges] = useState("")
  const [invoiceDescription, setInvoiceDescription] = useState("")
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false)

  useEffect(() => {
    loadServiceProviderTasks()
    
    // Set up auto-refresh every 20 seconds so admins see real-time updates
    const refreshInterval = setInterval(() => {
      console.log("[v0] Auto-refreshing service provider tasks...")
      loadServiceProviderTasks()
    }, 20000)
    
    return () => clearInterval(refreshInterval)
  }, [user])

  const loadServiceProviderTasks = async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      // For admin/IT head, show all repairs assigned to service providers
      // For service provider users, show only their repairs
      const isAdmin = user.role === "admin" || user.role === "it_head" || user.role === "regional_it_head"
      const url = isAdmin 
        ? `/api/repairs/tasks?viewAll=true`
        : `/api/repairs/tasks?service_provider_id=${user.id}`
      
      console.log("[v0] Loading service provider tasks from:", url, "User ID:", user.id, "User Role:", user.role)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const result = await response.json()
        console.error("[v0] API error response:", result)
        throw new Error(result.error || "Failed to load tasks")
      }

      const { tasks: data, message } = await response.json()
      
      console.log("[v0] Loaded tasks response:", data?.length || 0, "tasks")
      
      if (message) {
        console.log("[v0] API message:", message)
      }
      
      // Transform API data to match component interface
      const transformedTasks: ServiceProviderRepairTask[] = (data || []).map((task: any) => ({
        id: task.id,
        taskNumber: task.task_number || `TASK-${task.id.substring(0, 8)}`,
        deviceInfo: task.device_info || {
          type: "Unknown",
          brand: "Unknown",
          model: "Unknown",
          serialNumber: "",
          assetTag: "",
        },
        issueDescription: task.issue_description || "",
        priority: task.priority || "medium",
        status: task.status || "assigned",
        assignedBy: {
          name: task.assigned_by_name || "Unknown",
          role: "IT Staff",
          contact: "",
        },
        assignedDate: task.assigned_date || new Date().toISOString(),
        scheduledPickupDate: task.scheduled_pickup_date,
        collectedDate: task.collected_date,
        estimatedCompletionDate: task.estimated_completion_date,
        completedDate: task.completed_date,
        pickupLocation: task.location || "Unknown",
        contactPerson: task.assigned_by_name || "Unknown",
        contactPhone: "",
        attachments: task.attachments || [],
        statusHistory: task.status_history || [],
        repairNotes: task.repair_notes,
        partsUsed: task.parts_used,
        laborHours: task.labor_hours,
        repairCost: task.actual_cost,
        invoice: task.invoice || null,
      }))
      
      setTasks(transformedTasks)
    } catch (err: any) {
      console.error("[v0] Error loading service provider tasks:", err?.message || err)
      setError(err?.message || "Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true
    return task.status === filter
  })

  const updateTaskStatus = (taskId: string, newStatus: ServiceProviderRepairTask["status"], notes = "") => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              ...(newStatus === "pickup_scheduled" && scheduledDate && scheduledTime
                ? {
                    scheduledPickupDate: `${scheduledDate}T${scheduledTime}:00Z`,
                  }
                : {}),
              ...(newStatus === "collected"
                ? {
                    collectedDate: new Date().toISOString(),
                  }
                : {}),
              ...(newStatus === "completed"
                ? {
                    completedDate: new Date().toISOString(),
                  }
                : {}),
              statusHistory: [
                ...task.statusHistory,
                {
                  status: newStatus,
                  date: new Date().toISOString(),
                  notes: notes || `Status updated to ${newStatus.replace("_", " ")}`,
                  updatedBy: user?.name || "Service Provider",
                },
              ],
            }
          : task,
      ),
    )
  }

  const handleSchedulePickup = async () => {
    if (selectedTask && scheduledDate && scheduledTime) {
      try {
        const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00Z`
        
        console.log("[v0] Scheduling pickup for repair:", selectedTask.id, "Date:", scheduledDateTime)
        
        // Call API to save schedule to database
        const response = await fetch("/api/repairs/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedTask.id,
            status: "pickup_scheduled",
            scheduled_pickup_date: scheduledDateTime,
            notes: pickupNotes,
          }),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to schedule pickup")
        }
        
        const result = await response.json()
        console.log("[v0] Pickup scheduled successfully:", result)
        
        // Update local state only after API success
        updateTaskStatus(
          selectedTask.id,
          "pickup_scheduled",
          `Pickup scheduled for ${scheduledDate} at ${scheduledTime}. ${pickupNotes}`,
        )
        
        // Close dialog and reset form
        setSelectedTask(null)
        setScheduledDate("")
        setScheduledTime("")
        setPickupNotes("")
        
        toast({
          title: "📅 Pickup Scheduled Successfully",
          description: `Pickup scheduled for ${scheduledDate} at ${scheduledTime}`,
        })
      } catch (error: any) {
        console.error("[v0] Error scheduling pickup:", error)
        toast({
          title: "❌ Failed to Schedule Pickup",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      }
    }
  }

  const handleCompleteRepair = async () => {
    if (selectedTask) {
      try {
        console.log("[v0] Completing repair:", selectedTask.id)
        
        // Call API to save repair completion to database
        const response = await fetch("/api/repairs/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedTask.id,
            status: "completed",
            work_notes: repairNotes,
            actual_hours: laborHours ? Number.parseFloat(laborHours) : undefined,
            completed_at: new Date().toISOString(),
          }),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to complete repair")
        }
        
        const result = await response.json()
        console.log("[v0] Repair completed successfully:", result)
        
        const updatedTask = {
          ...selectedTask,
          repairNotes,
          laborHours: laborHours ? Number.parseFloat(laborHours) : undefined,
          repairCost: repairCost ? Number.parseFloat(repairCost) : undefined,
        }

        // Update local state only after API success
        setTasks((prev) => prev.map((task) => (task.id === selectedTask.id ? updatedTask : task)))
        updateTaskStatus(selectedTask.id, "completed", `Repair completed. ${repairNotes}`)
        
        // Close dialog and reset form
        setSelectedTask(null)
        setRepairNotes("")
        setLaborHours("")
        setRepairCost("")
        
        toast({
          title: "✅ Repair Completed Successfully",
          description: "The repair task has been marked as completed",
        })
      } catch (error: any) {
        console.error("[v0] Error completing repair:", error)
        toast({
          title: "❌ Failed to Complete Repair",
          description: error.message || "An error occurred",
          variant: "destructive",
        })
      }
    }
  }

  const handleUploadInvoice = async () => {
    if (!selectedTask || !invoiceFile || !invoiceNumber) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please fill in required fields and select a file",
        variant: "destructive",
      })
      return
    }

    setIsUploadingInvoice(true)
    try {
      const totalCost =
        (invoiceLaborCost ? Number.parseFloat(invoiceLaborCost) : 0) +
        (invoicePartsCost ? Number.parseFloat(invoicePartsCost) : 0) +
        (invoiceOtherCharges ? Number.parseFloat(invoiceOtherCharges) : 0)

      const formData = new FormData()
      formData.append("repair_id", selectedTask.id)
      // Pass the user ID to the API, which will look up the service provider ID
      formData.append("user_id", user?.id || "")
      formData.append("service_provider_name", user?.name || "")
      formData.append("uploaded_by", user?.id || "")
      formData.append("uploaded_by_name", user?.name || "")
      formData.append("invoice_number", invoiceNumber)
      formData.append("invoice_date", invoiceDate)
      formData.append("labor_cost", invoiceLaborCost)
      formData.append("parts_cost", invoicePartsCost)
      formData.append("other_charges", invoiceOtherCharges)
      formData.append("total_amount", totalCost.toString())
      formData.append("labor_hours", selectedTask.laborHours?.toString() || "")
      formData.append("description", invoiceDescription)
      formData.append("file", invoiceFile)

      console.log("[v0] Uploading invoice for repair:", selectedTask.id, "User ID:", user?.id)

      const response = await fetch("/api/repairs/invoice", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload invoice")
      }

      const result = await response.json()

      // Update task with invoice
      setTasks((prev) =>
        prev.map((task) =>
          task.id === selectedTask.id
            ? {
                ...task,
                invoice: {
                  id: result.invoice.id,
                  file_url: result.invoice.file_url,
                  status: "pending",
                  total_amount: result.invoice.total_amount,
                  invoice_number: result.invoice.invoice_number,
                  created_at: result.invoice.created_at,
                },
              }
            : task,
        ),
      )

      console.log("[v0] Invoice uploaded successfully:", result.invoice.id)

      setInvoiceDialogOpen(false)
      setSelectedTask(null)
      setInvoiceFile(null)
      setInvoiceNumber("")
      setInvoiceDate("")
      setInvoiceLaborCost("")
      setInvoicePartsCost("")
      setInvoiceOtherCharges("")
      setInvoiceDescription("")

      toast({
        title: "📄 Invoice Uploaded Successfully",
        description: "Invoice is pending approval",
      })
    } catch (err: any) {
      console.error("[v0] Error uploading invoice:", err)
      toast({
        title: "❌ Failed to Upload Invoice",
        description: err.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUploadingInvoice(false)
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
      case "pickup_scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
      case "collected":
        return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300"
      case "in_repair":
        return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300"
      case "returned":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
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
            <p className="text-muted-foreground">Assigned repair tasks from QCC IT Department • {user?.name}</p>
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
            <div className="text-2xl font-bold">{tasks.filter((t) => t.status === "assigned").length}</div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduled
            </CardTitle>
            <div className="text-2xl font-bold">{tasks.filter((t) => t.status === "pickup_scheduled").length}</div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              In Repair
            </CardTitle>
            <div className="text-2xl font-bold">
              {tasks.filter((t) => ["collected", "in_repair"].includes(t.status)).length}
            </div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed
            </CardTitle>
            <div className="text-2xl font-bold">
              {tasks.filter((t) => ["completed", "returned"].includes(t.status)).length}
            </div>
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
        {loading ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Loading repair tasks...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-lg font-semibold mb-2 text-red-600">Error loading tasks</p>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadServiceProviderTasks} variant="outline">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-lg font-semibold mb-2">No tasks found</p>
              <p className="text-muted-foreground">
                {filter === "all" ? "No repair tasks assigned yet" : `No ${filter.replace("_", " ")} tasks found`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{task.taskNumber}</CardTitle>
                      <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      <Badge className={getStatusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">
                          {task.deviceInfo.type} - {task.deviceInfo.brand} {task.deviceInfo.model}
                        </p>
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

                    {task.status === "completed" && !task.invoice && (
                      <Dialog open={invoiceDialogOpen && selectedTask?.id === task.id} onOpenChange={setInvoiceDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedTask(task)}
                            className="bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Invoice
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Upload Repair Invoice</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                                <Input
                                  id="invoiceNumber"
                                  placeholder="INV-001"
                                  value={invoiceNumber}
                                  onChange={(e) => setInvoiceNumber(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="invoiceDate">Invoice Date</Label>
                                <Input
                                  id="invoiceDate"
                                  type="date"
                                  value={invoiceDate}
                                  onChange={(e) => setInvoiceDate(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="laborCost">Labor Cost (GHS)</Label>
                                <Input
                                  id="laborCost"
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={invoiceLaborCost}
                                  onChange={(e) => setInvoiceLaborCost(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="partsCost">Parts Cost (GHS)</Label>
                                <Input
                                  id="partsCost"
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={invoicePartsCost}
                                  onChange={(e) => setInvoicePartsCost(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="otherCharges">Other Charges (GHS)</Label>
                                <Input
                                  id="otherCharges"
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={invoiceOtherCharges}
                                  onChange={(e) => setInvoiceOtherCharges(e.target.value)}
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor="description">Description (Optional)</Label>
                              <Textarea
                                id="description"
                                placeholder="Additional invoice details or notes..."
                                value={invoiceDescription}
                                onChange={(e) => setInvoiceDescription(e.target.value)}
                              />
                            </div>

                            <div>
                              <Label htmlFor="invoiceFile">Invoice File (PDF, Image, or Document)</Label>
                              <Input
                                id="invoiceFile"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                              />
                              {invoiceFile && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  Selected: {invoiceFile.name}
                                </p>
                              )}
                            </div>

                            <Button
                              onClick={handleUploadInvoice}
                              disabled={isUploadingInvoice || !invoiceFile || !invoiceNumber}
                              className="w-full bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-700 hover:to-cyan-800 text-white"
                            >
                              {isUploadingInvoice ? "Uploading..." : "Upload Invoice"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {task.invoice && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Invoice #{task.invoice.invoice_number}</p>
                          <p className="text-xs text-blue-700 dark:text-blue-400">
                            Status: <span className="font-semibold">{task.invoice.status}</span>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                        >
                          <a href={task.invoice.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
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
                                    <p>
                                      <strong>Type:</strong> {task.deviceInfo.type}
                                    </p>
                                    <p>
                                      <strong>Brand:</strong> {task.deviceInfo.brand}
                                    </p>
                                    <p>
                                      <strong>Model:</strong> {task.deviceInfo.model}
                                    </p>
                                    <p>
                                      <strong>Serial:</strong> {task.deviceInfo.serialNumber}
                                    </p>
                                    <p>
                                      <strong>Asset Tag:</strong> {task.deviceInfo.assetTag}
                                    </p>
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
                                    <p>
                                      <strong>Assigned By:</strong> {task.assignedBy.name}
                                    </p>
                                    <p>
                                      <strong>Role:</strong> {task.assignedBy.role}
                                    </p>
                                    <p>
                                      <strong>Contact:</strong> {task.assignedBy.contact}
                                    </p>
                                    <p>
                                      <strong>Phone:</strong> {task.contactPhone}
                                    </p>
                                    <p>
                                      <strong>Location:</strong> {task.pickupLocation}
                                    </p>
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
                                      <span className="font-medium capitalize">{entry.status.replace("_", " ")}</span>
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
          ))
        )}
      </div>
    </div>
  )
}
