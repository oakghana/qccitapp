"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ReassignTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: any
  itStaff: any[]
  onReassignSuccess: () => void
  currentUser: any
}

export function ReassignTicketDialog({
  open,
  onOpenChange,
  ticket,
  itStaff,
  onReassignSuccess,
  currentUser,
}: ReassignTicketDialogProps) {
  const [selectedStaff, setSelectedStaff] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [localStaffList, setLocalStaffList] = useState<any[]>([])

  useEffect(() => {
    // Load staff members when dialog opens
    if (open && (!itStaff || itStaff.length === 0)) {
      console.log("[v0] Reassign Dialog: itStaff is empty or missing, fetching from API")
      loadStaff()
    } else if (open && itStaff && itStaff.length > 0) {
      console.log("[v0] Reassign Dialog: Using provided itStaff list, count:", itStaff.length)
      setLocalStaffList(itStaff)
    }
    // Initialize selected staff to the ticket's current assignee when opening
    if (open && ticket) {
      const currentAssigneeId = ticket.assignedToId || ticket.assigned_to || ticket.assigned_to_id || ""
      setSelectedStaff(currentAssigneeId)
    }
    // Clear selection when dialog closes
    if (!open) {
      setSelectedStaff("")
      setReason("")
    }
  }, [open, itStaff])

  const loadStaff = async () => {
    try {
      const response = await fetch("/api/staff-members?roles=it_staff,it_technician,service_desk_head,regional_it_head&onlyActive=true")
      const result = await response.json()
      
      if (result.success && result.data && result.data.length > 0) {
        console.log("[v0] Reassign Dialog: Loaded staff from API, count:", result.data.length)
        setLocalStaffList(result.data)
      } else {
        console.warn("[v0] Reassign Dialog: API returned no active staff; retrying without onlyActive filter")
        // Try again including inactive staff as a fallback so admins can reassign
        try {
          const fallbackResp = await fetch("/api/staff-members?roles=it_staff,service_desk_head,regional_it_head&onlyActive=false")
          const fallbackResult = await fallbackResp.json()
          if (fallbackResult.success && fallbackResult.data && fallbackResult.data.length > 0) {
            console.log("[v0] Reassign Dialog: Fallback loaded staff, count:", fallbackResult.data.length)
            setLocalStaffList(fallbackResult.data)
          } else {
            console.error("[v0] Reassign Dialog: No staff available after fallback")
          }
        } catch (err) {
          console.error("[v0] Reassign Dialog: Fallback error loading staff:", err)
        }
      }
    } catch (error) {
      console.error("[v0] Reassign Dialog: Error loading staff:", error)
    }
  }

  const handleReassign = async () => {
    if (!selectedStaff) {
      toast.error("Please select a staff member")
      return
    }

    setIsLoading(true)
    try {
      const staffMember = localStaffList.find((s) => s.id === selectedStaff)

      // Ensure we send the DB primary key (uuid) to the API; the `ticket` prop
      // may be a mapped object where `id` is the ticket_number. Use known
      // fallbacks `dbId` or `uuid` when available.
      const ticketId = ticket?.dbId || ticket?.uuid || ticket?.id

      const response = await fetch("/api/service-tickets/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          newAssigneeId: selectedStaff,
          newAssignee: staffMember?.full_name || staffMember?.name,
          reassignedBy: currentUser?.id,
          reassignedByName: currentUser?.full_name || currentUser?.name,
          reason: reason,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || "Failed to reassign ticket")
        return
      }

      toast.success(`Ticket reassigned to ${staffMember?.full_name || staffMember?.name}`)
      setSelectedStaff("")
      setReason("")
      onOpenChange(false)
      onReassignSuccess()
    } catch (error) {
      console.error("Error reassigning ticket:", error)
      toast.error("An error occurred while reassigning the ticket")
    } finally {
      setIsLoading(false)
    }
  }

  const staffToDisplay = localStaffList.length > 0 ? localStaffList : itStaff || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reassign Ticket</DialogTitle>
          <DialogDescription>
            {ticket?.title} - {ticket?.ticket_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="staff">Assign to Staff Member</Label>
            {staffToDisplay.length === 0 ? (
              <div className="text-sm text-red-600 p-2 bg-red-50 rounded">
                No staff members available. Please ensure there are active IT staff in the system.
              </div>
            ) : null}
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Select IT staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffToDisplay.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.full_name || staff.name} - {staff.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Reassignment</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for reassignment (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReassign} disabled={isLoading || !selectedStaff || staffToDisplay.length === 0}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reassigning...
              </>
            ) : (
              "Reassign Ticket"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
