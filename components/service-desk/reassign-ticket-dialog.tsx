"use client"

import { useState } from "react"
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

  const handleReassign = async () => {
    if (!selectedStaff) {
      toast.error("Please select a staff member")
      return
    }

    setIsLoading(true)
    try {
      const staffMember = itStaff.find((s) => s.id === selectedStaff)
      
      const response = await fetch("/api/service-tickets/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
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
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger>
                <SelectValue placeholder="Select IT staff member" />
              </SelectTrigger>
              <SelectContent>
                {itStaff.map((staff) => (
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
          <Button onClick={handleReassign} disabled={isLoading || !selectedStaff}>
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
