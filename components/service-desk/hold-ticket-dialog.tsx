"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface HoldTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: any
  onHoldSuccess: () => void
  currentUser: any
  isResuming?: boolean
}

export function HoldTicketDialog({
  open,
  onOpenChange,
  ticket,
  onHoldSuccess,
  currentUser,
  isResuming = false,
}: HoldTicketDialogProps) {
  const [holdReason, setHoldReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleHold = async () => {
    if (!holdReason.trim() && !isResuming) {
      toast.error("Please provide a reason for holding the ticket")
      return
    }

    setIsLoading(true)
    try {
      if (isResuming) {
        // Resume ticket
        const response = await fetch("/api/service-tickets/hold", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: ticket.id,
            resumedBy: currentUser?.id,
            resumedByName: currentUser?.full_name || currentUser?.name,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          toast.error(result.error || "Failed to resume ticket")
          return
        }

        toast.success("Ticket resumed from hold")
      } else {
        // Hold ticket
        const response = await fetch("/api/service-tickets/hold", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: ticket.id,
            holdReason: holdReason,
            heldBy: currentUser?.id,
            heldByName: currentUser?.full_name || currentUser?.name,
            heldByRole: currentUser?.role,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          toast.error(result.error || "Failed to hold ticket")
          return
        }

        toast.success("Ticket placed on hold due to procurement requirements")
      }

      setHoldReason("")
      onOpenChange(false)
      onHoldSuccess()
    } catch (error) {
      console.error("Error:", error)
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isResuming ? "Resume Ticket from Hold" : "Place Ticket on Hold"}</DialogTitle>
          <DialogDescription>
            {ticket?.title} - {ticket?.ticket_number}
          </DialogDescription>
        </DialogHeader>

        {!isResuming && (
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                ⚠️ Placing this ticket on hold will exclude it from productivity metrics for the assigned staff member.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Hold (Procurement/Other)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Waiting for equipment procurement, pending parts delivery, etc."
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )}

        {isResuming && (
          <div className="space-y-4 py-4">
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-900 dark:text-green-100">
                ✓ The ticket will be resumed and productivity tracking will resume.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleHold} 
            disabled={isLoading || (!isResuming && !holdReason.trim())}
            variant={isResuming ? "default" : "destructive"}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isResuming ? "Resuming..." : "Placing on Hold..."}
              </>
            ) : (
              isResuming ? "Resume Ticket" : "Place on Hold"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
