"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  User, 
  Send, 
  Calendar, 
  Clock, 
  MapPin, 
  Mail,
  CheckCircle,
  AlertTriangle,
  Users
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getRoleColorScheme } from "@/lib/role-colors"
import { cn } from "@/lib/utils"

interface AssignTicketData {
  ticketId: string
  assignee: string
  priority: "low" | "medium" | "high" | "urgent"
  dueDate: string
  instructions: string
  notifyEmail: boolean
  notifySMS: boolean
}

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  location: string
  department: string
  isOnline: boolean
  currentTickets: number
}

// Mock staff data - in real app, this would come from API
const mockStaff: StaffMember[] = [
  {
    id: "IT001",
    name: "John Mensah",
    email: "john.mensah@qcc.com.gh",
    phone: "+233241234567",
    role: "IT Staff",
    location: "Head Office",
    department: "IT",
    isOnline: true,
    currentTickets: 3
  },
  {
    id: "IT002",
    name: "Kwame Asante",
    email: "kwame.asante@qcc.com.gh", 
    phone: "+233241234568",
    role: "IT Staff",
    location: "Kumasi",
    department: "IT",
    isOnline: true,
    currentTickets: 2
  },
  {
    id: "IT003",
    name: "Ama Osei",
    email: "ama.osei@qcc.com.gh",
    phone: "+233241234569",
    role: "IT Staff",
    location: "Accra",
    department: "IT",
    isOnline: false,
    currentTickets: 5
  }
]

const priorityColors = {
  low: { bg: "bg-green-50 dark:bg-green-950", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-800" },
  medium: { bg: "bg-yellow-50 dark:bg-yellow-950", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-200 dark:border-yellow-800" },
  high: { bg: "bg-orange-50 dark:bg-orange-950", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800" },
  urgent: { bg: "bg-red-50 dark:bg-red-950", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800" }
}

interface AssignTicketDialogProps {
  ticketId: string
  ticketTitle: string
  isOpen: boolean
  onClose: () => void
  onAssign: (assignment: AssignTicketData) => void
}

export function AssignTicketDialog({ 
  ticketId, 
  ticketTitle, 
  isOpen, 
  onClose, 
  onAssign 
}: AssignTicketDialogProps) {
  const { user } = useAuth()
  const roleColors = user?.role ? getRoleColorScheme(user.role) : null
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assignmentData, setAssignmentData] = useState<AssignTicketData>({
    ticketId,
    assignee: "",
    priority: "medium",
    dueDate: "",
    instructions: "",
    notifyEmail: true,
    notifySMS: false
  })

  // Filter staff based on user's location access
  const getAvailableStaff = () => {
    if (user?.role === "admin" || (user?.role === "it_head" && user?.location === "head_office")) {
      return mockStaff // Can assign to all staff
    }
    
    // Regional IT Head or location-specific IT Head can only assign to their location
    if (user?.role === "regional_it_head" || user?.role === "it_head") {
      return mockStaff.filter(staff => staff.location.toLowerCase().replace(" ", "_") === user.location)
    }

    return []
  }

  const availableStaff = getAvailableStaff()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    onAssign(assignmentData)
    
    // Send notification (mock)
    if (assignmentData.notifyEmail) {
      console.log("Email notification sent to assigned staff")
    }
    
    setIsSubmitting(false)
    onClose()
  }

  const selectedStaff = availableStaff.find(staff => staff.id === assignmentData.assignee)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Assign Ticket to Staff
          </DialogTitle>
          <DialogDescription>
            Assign ticket "{ticketTitle}" to an IT staff member in your location
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ticket Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Ticket ID</p>
                  <p className="font-medium">{ticketId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Title</p>
                  <p className="font-medium">{ticketTitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignee">Select Staff Member *</Label>
              <Select
                value={assignmentData.assignee}
                onValueChange={(value) => setAssignmentData(prev => ({ ...prev, assignee: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose staff member to assign" />
                </SelectTrigger>
                <SelectContent>
                  {availableStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            staff.isOnline ? "bg-green-500" : "bg-gray-400"
                          )} />
                          <span>{staff.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Badge variant="outline" className="text-xs">
                            {staff.currentTickets} tickets
                          </Badge>
                          <span className="text-xs text-muted-foreground">{staff.location}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Staff Info */}
            {selectedStaff && (
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">{selectedStaff.name}</span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          selectedStaff.isOnline ? "bg-green-500" : "bg-gray-400"
                        )} />
                        <span className="text-xs text-blue-700 dark:text-blue-300">
                          {selectedStaff.isOnline ? "Online" : "Offline"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-blue-700 dark:text-blue-300">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{selectedStaff.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{selectedStaff.location}</span>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        selectedStaff.currentTickets > 4 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                      )}
                    >
                      {selectedStaff.currentTickets} active tickets
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Priority and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority Level *</Label>
              <Select
                value={assignmentData.priority}
                onValueChange={(value) => setAssignmentData(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Low Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <span>Medium Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span>High Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Urgent</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={assignmentData.dueDate}
                onChange={(e) => setAssignmentData(prev => ({ ...prev, dueDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <Label htmlFor="instructions">Assignment Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Provide specific instructions, context, or requirements for this ticket..."
              value={assignmentData.instructions}
              onChange={(e) => setAssignmentData(prev => ({ ...prev, instructions: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>

          {/* Notification Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Settings</CardTitle>
              <CardDescription>Choose how to notify the assigned staff member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notifyEmail"
                  checked={assignmentData.notifyEmail}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, notifyEmail: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="notifyEmail" className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Send email notification</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notifySMS"
                  checked={assignmentData.notifySMS}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, notifySMS: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="notifySMS" className="flex items-center space-x-2">
                  <span>📱</span>
                  <span>Send SMS notification</span>
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !assignmentData.assignee}
              className={cn(
                "flex-1 text-white",
                roleColors ? `bg-gradient-to-r ${roleColors.gradient} ${roleColors.hoverGradient}` : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Assigning Ticket...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Assign Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
