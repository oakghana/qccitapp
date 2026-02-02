"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { User, Send, MapPin, Mail, AlertTriangle, Users, Loader2, Edit } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getRoleColorScheme } from "@/lib/role-colors"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

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

const priorityColors = {
  low: {
    bg: "bg-green-50 dark:bg-green-950",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  medium: {
    bg: "bg-yellow-50 dark:bg-yellow-950",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  high: {
    bg: "bg-orange-50 dark:bg-orange-950",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  urgent: {
    bg: "bg-red-50 dark:bg-red-950",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
  },
}

interface AssignTicketDialogProps {
  ticketId: string
  ticketTitle: string
  ticketLocation?: string
  isOpen: boolean
  onClose: () => void
  onAssign: (assignment: AssignTicketData) => void
}

export function AssignTicketDialog({
  ticketId,
  ticketTitle,
  ticketLocation,
  isOpen,
  onClose,
  onAssign,
}: AssignTicketDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const roleColors = user?.role ? getRoleColorScheme(user.role) : null
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([])
  const [allStaff, setAllStaff] = useState<StaffMember[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [assignmentData, setAssignmentData] = useState<AssignTicketData>({
    ticketId,
    assignee: "",
    priority: "medium",
    dueDate: "",
    instructions: "",
    notifyEmail: true,
    notifySMS: false,
  })

  useEffect(() => {
    if (isOpen) {
      // Default to "all" for admin/service_desk_head/it_head, otherwise use ticket location
      if (user?.role === "admin" || user?.role === "it_head" || user?.role === "service_desk_head") {
        setSelectedLocation("all")
      } else {
        setSelectedLocation(ticketLocation || "all")
      }
      loadItStaff()
    }
  }, [isOpen, ticketLocation, user?.role])

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "it_head" || user?.role === "service_desk_head") {
      if (selectedLocation === "all") {
        setAvailableStaff(allStaff)
      } else {
        const filtered = allStaff.filter((s) => {
          const staffLoc = (s.location || "").toLowerCase().trim()
          const filterLoc = selectedLocation.toLowerCase().trim()
          return staffLoc === filterLoc || staffLoc.includes(filterLoc) || filterLoc.includes(staffLoc)
        })
        setAvailableStaff(filtered)
      }
    }
  }, [selectedLocation, allStaff, user?.role])

  const loadItStaff = async () => {
    try {
      setLoadingStaff(true)
      const roleParam = 'staff_roles'
      // Admin/IT Head/Service Desk Head should get all staff, then filter by location in UI
      const locationParam = (user?.role === 'admin' || user?.role === 'it_head' || user?.role === 'service_desk_head') 
        ? 'all' 
        : (ticketLocation ? encodeURIComponent(ticketLocation) : 'all')
      const userRoleParam = user?.role || 'staff'
      
      const url = `/api/staff/list?role=${roleParam}&location=${locationParam}&userRole=${userRoleParam}`
      console.log('[v0] Fetching IT staff from:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Bypass cache/service worker
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[v0] Failed to load IT staff. Status:', response.status, 'Error:', errorText)
        setLoadingStaff(false)
        return
      }
      const data = await response.json()
      const staffList = data.staff || []

      console.log('[v0] Loaded IT staff for assignment:', staffList.length)

      const mappedStaff: StaffMember[] = staffList.map((s: any) => ({
        id: s.id,
        name: s.name || 'Unknown',
        email: s.email || '',
        phone: s.phone || '',
        role: s.role || 'Staff',
        location: s.location || 'Unknown',
        department: s.department || 'IT',
        isOnline: s.isOnline || true,
        currentTickets: 0,
      }))

      setAllStaff(mappedStaff)

      if (user?.role === 'admin' || user?.role === 'it_head' || user?.role === 'service_desk_head') {
        if (ticketLocation) {
          const ticketLoc = ticketLocation.toLowerCase().trim()
          const locationFiltered = mappedStaff.filter((s) => {
            const staffLoc = (s.location || '').toLowerCase().trim()
            return staffLoc === ticketLoc || staffLoc.includes(ticketLoc) || ticketLoc.includes(staffLoc)
          })
          setAvailableStaff(locationFiltered.length > 0 ? locationFiltered : mappedStaff)
        } else {
          setAvailableStaff(mappedStaff)
        }
      } else if (user?.role === 'regional_it_head') {
        const userLoc = (user?.location || '').toLowerCase().trim()
        const regionFiltered = mappedStaff.filter((s) => {
          const staffLoc = (s.location || '').toLowerCase().trim()
          return staffLoc === userLoc || staffLoc.includes(userLoc) || userLoc.includes(staffLoc)
        })
        setAllStaff(regionFiltered)
        setAvailableStaff(regionFiltered)
      } else {
        setAvailableStaff(mappedStaff)
      }

      setLoadingStaff(false)
    } catch (error) {
      console.error('[v0] Error loading IT staff:', error)
      setLoadingStaff(false)
      toast({
        title: "Error Loading Staff",
        description: "Failed to load IT staff members. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!assignmentData.assignee) {
      toast({
        title: "Selection Required",
        description: "Please select a staff member to assign",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const selectedStaffMember = availableStaff.find((s) => s.id === assignmentData.assignee)

      console.log("[v0] Submitting assignment - ticketId:", ticketId, "staff:", selectedStaffMember?.name)

      const response = await fetch("/api/service-tickets/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticketId,
          assigneeId: selectedStaffMember?.id || assignmentData.assignee,
          assignee: selectedStaffMember?.name || assignmentData.assignee,
          assigneeEmail: selectedStaffMember?.email,
          assigneePhone: selectedStaffMember?.phone,
          priority: assignmentData.priority,
          dueDate: assignmentData.dueDate,
          instructions: assignmentData.instructions,
          assignedBy: user?.full_name || user?.name || user?.email || "IT Head",
          assignedById: user?.id,
          notifyEmail: assignmentData.notifyEmail,
          notifySMS: assignmentData.notifySMS,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Assignment failed:", result.error)
        toast({
          title: "Assignment Failed",
          description: result.error || "Failed to assign ticket. Please try again.",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      console.log("[v0] Assignment successful:", result)

      toast({
        title: "Ticket Assigned",
        description: `Ticket successfully assigned to ${selectedStaffMember?.name || assignmentData.assignee}`,
      })

      onAssign({
        ...assignmentData,
        assignee: selectedStaffMember?.name || assignmentData.assignee,
      })

      onClose()
    } catch (error) {
      console.error("[v0] Error assigning ticket:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedStaff = availableStaff.find((staff) => staff.id === assignmentData.assignee)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Assign Ticket to Staff
          </DialogTitle>
          <DialogDescription>Assign ticket "{ticketTitle}" to an IT staff member in your location</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-4">
            {(user?.role === "admin" || user?.role === "it_head" || user?.role === "service_desk_head") && (
              <div>
                <Label htmlFor="locationFilter">Filter by Location</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations ({allStaff.length} staff)</SelectItem>
                    {Array.from(new Set(allStaff.map((s) => s.location).filter(Boolean))).map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc} ({allStaff.filter((s) => s.location === loc).length} staff)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="assignee">Select Staff Member *</Label>
              {loadingStaff ? (
                <div className="flex items-center gap-2 p-4 border rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">Loading IT staff...</span>
                </div>
              ) : availableStaff.length === 0 ? (
                <div className="p-4 border rounded-md bg-yellow-50 dark:bg-yellow-950 border-yellow-200">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                      No IT staff found{selectedLocation !== "all" ? ` for ${selectedLocation}` : ""}.{" "}
                      {user?.role === "admin" || user?.role === "it_head"
                        ? "Try selecting 'All Locations' above."
                        : "Please contact the administrator."}
                    </span>
                  </div>
                </div>
              ) : (
                <Select
                  value={assignmentData.assignee}
                  onValueChange={(value) => setAssignmentData((prev) => ({ ...prev, assignee: value }))}
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
                            <div
                              className={cn("w-2 h-2 rounded-full", staff.isOnline ? "bg-green-500" : "bg-gray-400")}
                            />
                            <span>{staff.name}</span>
                            <span className="text-xs text-muted-foreground">({staff.role})</span>
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
              )}
            </div>

            {selectedStaff && (
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900 dark:text-blue-100">{selectedStaff.name}</span>
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            selectedStaff.isOnline ? "bg-green-500" : "bg-gray-400",
                          )}
                        />
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
                        selectedStaff.currentTickets > 4 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800",
                      )}
                    >
                      {selectedStaff.currentTickets} active tickets
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority Level *</Label>
              <Select
                value={assignmentData.priority}
                onValueChange={(value) => setAssignmentData((prev) => ({ ...prev, priority: value as any }))}
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
                onChange={(e) => setAssignmentData((prev) => ({ ...prev, dueDate: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instructions">Assignment Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Provide specific instructions, context, or requirements for this ticket..."
              value={assignmentData.instructions}
              onChange={(e) => setAssignmentData((prev) => ({ ...prev, instructions: e.target.value }))}
              className="min-h-[100px]"
            />
          </div>

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
                  onChange={(e) => setAssignmentData((prev) => ({ ...prev, notifyEmail: e.target.checked }))}
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
                  onChange={(e) => setAssignmentData((prev) => ({ ...prev, notifySMS: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="notifySMS" className="flex items-center space-x-2">
                  <span>📱</span>
                  <span>Send SMS notification</span>
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !assignmentData.assignee}
              className={cn(
                "flex-1 text-white",
                roleColors
                  ? `bg-gradient-to-r ${roleColors.gradient} ${roleColors.hoverGradient}`
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
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
