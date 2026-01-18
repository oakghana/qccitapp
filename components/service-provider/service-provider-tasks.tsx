"use client"

import { useState, useEffect } from "react"
import { dateFmt, numFmt } from "@/lib/format-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  FileText,
  Calendar,
  Package,
  Truck,
  Timer,
  Phone,
  User,
  Upload,
  File,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

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

interface InvoiceUploadFormProps {
  repairId: string
  taskNumber: string
  serviceProviderId: string | null
  serviceProviderName: string
  onUploadSuccess: () => void
}

function InvoiceUploadForm({
  repairId,
  taskNumber,
  serviceProviderId,
  serviceProviderName,
  onUploadSuccess,
}: InvoiceUploadFormProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [totalAmount, setTotalAmount] = useState("")
  const [laborCost, setLaborCost] = useState("")
  const [partsCost, setPartsCost] = useState("")
  const [otherCharges, setOtherCharges] = useState("")
  const [laborHours, setLaborHours] = useState("")
  const [partsUsed, setPartsUsed] = useState("")
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(selectedFile.type)) {
        alert('Please select a PDF or image file (JPEG, PNG)')
        return
      }
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !invoiceNumber || !totalAmount) {
      alert('Please fill in all required fields and select a file')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('repairId', repairId)
      formData.append('invoiceNumber', invoiceNumber)
      formData.append('totalAmount', totalAmount)
      formData.append('laborCost', laborCost || '0')
      formData.append('partsCost', partsCost || '0')
      formData.append('otherCharges', otherCharges || '0')
      formData.append('laborHours', laborHours || '')
      formData.append('partsUsed', partsUsed)
      formData.append('description', description)
      // Use the authenticated user's id for uploaded_by (profiles table id)
      formData.append('uploadedBy', (user?.id as string) || '')
      formData.append('uploadedByName', serviceProviderName)
      formData.append('serviceProviderId', serviceProviderId || '')
      formData.append('serviceProviderName', serviceProviderName)

      const response = await fetch('/api/repairs/invoices', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload invoice')
      }

      setUploadSuccess(true)
      onUploadSuccess()

      // Reset form
      setFile(null)
      setInvoiceNumber("")
      setTotalAmount("")
      setLaborCost("")
      setPartsCost("")
      setOtherCharges("")
      setLaborHours("")
      setPartsUsed("")
      setDescription("")

      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (error) {
      console.error('Error uploading invoice:', error)
      alert('Failed to upload invoice. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {uploadSuccess && (
        <div className="bg-green-50 dark:bg-green-950/50 p-3 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300">
            ✅ Invoice uploaded successfully! It will be reviewed by IT Head and Admin.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="invoiceNumber">Invoice Number *</Label>
          <Input
            id="invoiceNumber"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="e.g., INV-2024-001"
            required
          />
        </div>

        <div>
          <Label htmlFor="totalAmount">Total Amount (GHS) *</Label>
          <Input
            id="totalAmount"
            type="number"
            step="0.01"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="laborCost">Labor Cost (GHS)</Label>
          <Input
            id="laborCost"
            type="number"
            step="0.01"
            value={laborCost}
            onChange={(e) => setLaborCost(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <Label htmlFor="partsCost">Parts Cost (GHS)</Label>
          <Input
            id="partsCost"
            type="number"
            step="0.01"
            value={partsCost}
            onChange={(e) => setPartsCost(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <Label htmlFor="otherCharges">Other Charges (GHS)</Label>
          <Input
            id="otherCharges"
            type="number"
            step="0.01"
            value={otherCharges}
            onChange={(e) => setOtherCharges(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="laborHours">Labor Hours</Label>
          <Input
            id="laborHours"
            type="number"
            step="0.5"
            value={laborHours}
            onChange={(e) => setLaborHours(e.target.value)}
            placeholder="0.0"
          />
        </div>

        <div>
          <Label htmlFor="partsUsed">Parts Used</Label>
          <Input
            id="partsUsed"
            value={partsUsed}
            onChange={(e) => setPartsUsed(e.target.value)}
            placeholder="e.g., Screen, Battery, Keyboard"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details about the repair work..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="file">Invoice File *</Label>
        <div className="mt-1">
          <input
            id="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
            required
          />
          <label
            htmlFor="file"
            className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none"
          >
            <div className="text-center">
              {file ? (
                <div className="flex items-center space-x-2">
                  <File className="w-8 h-8 text-blue-500" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Click to upload invoice (PDF, JPEG, PNG)
                  </span>
                  <span className="text-xs text-gray-400">Max 10MB</span>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Upload Invoice
          </>
        )}
      </Button>
    </form>
  )
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [providerId, setProviderId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadServiceProviderTasks()
  }, [user])

  // Real-time subscription for repair updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('service-provider-tasks-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'repair_requests'
        },
        (payload) => {
          console.log('[v0] Repair updated for service provider:', payload)
          // Reload tasks when any repair is updated
          loadServiceProviderTasks()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Only these roles can perform service-provider actions (schedule, update, view details)
  const canManage = !!user && ["service_provider", "admin", "it_head"].includes(user.role)

  const loadServiceProviderTasks = async () => {
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      // Resolve service provider id synchronously into a local variable so
      // we don't rely on React state timing (setProviderId is async).
      let localProviderId: string | null = null

      if (user.role === "service_provider") {
        try {
          const provRes = await fetch(`/api/admin/service-providers?activeOnly=true`)
          if (provRes.ok) {
            const provJson = await provRes.json()
            const providers: any[] = provJson.providers || []
            const match = providers.find((p) => p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase())
            if (match) {
              localProviderId = String(match.id)
            }
          }
        } catch (e) {
          console.warn("[v0] Failed to resolve service provider by email", e)
        }
      }

      // If service provider user and we couldn't resolve a provider record,
      // show a friendly message and stop instead of querying with an incorrect id.
      if (user.role === "service_provider" && !localProviderId) {
        setTasks([])
        setError("No service provider record found for your account. Contact admin.")
        setLoading(false)
        return
      }

      if (localProviderId) setProviderId(localProviderId)

      // For admin/IT head, show all repairs assigned to service providers
      // For service provider users, query by the resolved provider id
      const isAdmin = user.role === "admin" || user.role === "it_head" || user.role === "regional_it_head"
      const url = isAdmin
        ? `/api/repairs/tasks?viewAll=true`
        : user.role === "service_provider"
        ? `/api/repairs/tasks?service_provider_id=${localProviderId}`
        : `/api/repairs/tasks?service_provider_id=${user.id}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || "Failed to load tasks")
      }

      const { tasks: data, message } = await response.json()
      
      if (message) {
        console.log("[v0] API message:", message)
      }
      
      // Transform API data to match component interface
      const transformedTasks: ServiceProviderRepairTask[] = (data || [])
        .filter((task: any) => task && task.id) // Filter out null/undefined tasks
        .map((task: any) => ({
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
    if (!task || !task.id) return false // Additional null check
    if (filter === "all") return true
    return task.status === filter
  })

  const updateTaskStatus = async (taskId: string, newStatus: ServiceProviderRepairTask["status"], notes = "") => {
    try {
      // Prepare update data based on status
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      // Add status-specific fields
      if (newStatus === "pickup_scheduled" && scheduledDate && scheduledTime) {
        updateData.scheduled_pickup_date = `${scheduledDate}T${scheduledTime}:00Z`
      } else if (newStatus === "collected") {
        updateData.collected_date = new Date().toISOString()
      } else if (newStatus === "completed") {
        updateData.completed_at = new Date().toISOString()
        updateData.repair_notes = notes || repairNotes
        updateData.labor_hours = laborHours ? Number.parseFloat(laborHours) : undefined
        updateData.actual_cost = repairCost ? Number.parseFloat(repairCost) : undefined
      } else if (newStatus === "in_repair") {
        updateData.repair_notes = notes
      }

      // Call API to update database
      const response = await fetch("/api/repairs/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: taskId,
          ...updateData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update task status")
      }

      // Update local state
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
                      repairNotes: repairNotes,
                      laborHours: laborHours ? Number.parseFloat(laborHours) : undefined,
                      repairCost: repairCost ? Number.parseFloat(repairCost) : undefined,
                    }
                  : {}),
                ...(newStatus === "in_repair"
                  ? {
                      repairNotes: notes,
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

      console.log("[v0] Successfully updated task status:", taskId, newStatus)
    } catch (error) {
      console.error("[v0] Error updating task status:", error)
      setError("Failed to update task status. Please try again.")
    }
  }

  const handleSchedulePickup = async () => {
    if (selectedTask && scheduledDate && scheduledTime) {
      await updateTaskStatus(
        selectedTask.id,
        "pickup_scheduled",
        `Pickup scheduled for ${scheduledDate} at ${scheduledTime}. ${pickupNotes}`,
      )
      setSelectedTask(null)
      setScheduledDate("")
      setScheduledTime("")
      setPickupNotes("")
    }
  }

  const handleCompleteRepair = async () => {
    if (selectedTask) {
      await updateTaskStatus(selectedTask.id, "completed", `Repair completed. ${repairNotes}`)
      setSelectedTask(null)
      setRepairNotes("")
      setLaborHours("")
      setRepairCost("")
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
                    {task.status === "assigned" && canManage && (
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

                    {task.status === "pickup_scheduled" && canManage && (
                      <Button
                        size="sm"
                        onClick={async () => await updateTaskStatus(task.id, "collected", "Device collected successfully")}
                        className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Mark as Collected
                      </Button>
                    )}

                    {task.status === "collected" && canManage && (
                      <Button
                        size="sm"
                        onClick={async () => await updateTaskStatus(task.id, "in_repair", "Repair work started")}
                        className="bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white"
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        Start Repair
                      </Button>
                    )}

                    {task.status === "in_repair" && canManage && (
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
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="details">Task Details</TabsTrigger>
                            <TabsTrigger value="progress">Progress</TabsTrigger>
                            {user?.role === "service_provider" && <TabsTrigger value="invoices">Upload Invoice</TabsTrigger>}
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
                                {task.attachments && task.attachments.length > 0 && (
                                  <div>
                                    <Label className="font-semibold">Attachments</Label>
                                    <div className="flex gap-2 flex-wrap mt-2">
                                      {task.attachments.map((att, idx) => (
                                        <Button
                                          key={idx}
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(att, "_blank")}
                                        >
                                          <FileText className="h-4 w-4 mr-2" />
                                          {att.split("/").pop()}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                )}
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
                                    <span>{dateFmt(task.assignedDate)}</span>
                                  </div>
                                  {task.scheduledPickupDate && (
                                    <div className="flex justify-between text-sm">
                                      <span>Scheduled Pickup:</span>
                                      <span>{dateFmt(task.scheduledPickupDate)}</span>
                                    </div>
                                  )}
                                  {task.collectedDate && (
                                    <div className="flex justify-between text-sm">
                                      <span>Collected:</span>
                                      <span>{dateFmt(task.collectedDate)}</span>
                                    </div>
                                  )}
                                  {task.completedDate && (
                                    <div className="flex justify-between text-sm">
                                      <span>Completed:</span>
                                      <span>{dateFmt(task.completedDate)}</span>
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
                                        {dateFmt(entry.date)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{entry.notes}</p>
                                    <p className="text-xs text-muted-foreground">Updated by: {entry.updatedBy}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TabsContent>

                          {user?.role === "service_provider" && (
                            <TabsContent value="invoices" className="space-y-4">
                              
                            </TabsContent>
                          )}
                            <div className="space-y-4">
                              <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                  Upload Repair Invoice
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                                  Upload your invoice for this repair. This will be reviewed by IT Head and Admin only.
                                </p>

                                <InvoiceUploadForm
                                  repairId={task.id}
                                  taskNumber={task.taskNumber}
                                  serviceProviderId={providerId}
                                  serviceProviderName={user?.name || ""}
                                  onUploadSuccess={() => {
                                    // Refresh the task data or show success message
                                    console.log("Invoice uploaded successfully")
                                  }}
                                />
                              </div>
                            </div>
                          
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
                      {dateFmt(task.scheduledPickupDate)}
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
