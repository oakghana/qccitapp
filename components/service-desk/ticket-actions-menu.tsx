'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useNotification } from '@/hooks/use-notification-sound'
import { MoreVertical, CheckCircle2, Repeat2, MessageSquare, Loader2 } from 'lucide-react'

interface TicketActionsProps {
  ticketId: string
  ticketNumber: string
  ticketStatus: string
  assignedToId: string | null
  assignedToName: string | null
  requesterId: string
  requesterName: string
  currentUserId: string
  currentUserName: string
  currentUserRole: string
  onActionComplete?: () => void
  itStaffList?: Array<{ id: string; full_name: string; email: string; role: string }>
}

export const TicketActions: React.FC<TicketActionsProps> = ({
  ticketId,
  ticketNumber,
  ticketStatus,
  assignedToId,
  assignedToName,
  requesterId,
  requesterName,
  currentUserId,
  currentUserName,
  currentUserRole,
  onActionComplete,
  itStaffList = [],
}) => {
  const { toast } = useToast()
  const { showNotification } = useNotification()
  const [isLoading, setIsLoading] = useState(false)

  // Dialog states
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)

  // Form states
  const [completionNotes, setCompletionNotes] = useState('')
  const [selectedReassignee, setSelectedReassignee] = useState<string>('')
  const [reassignReason, setReassignReason] = useState('')
  const [messageText, setMessageText] = useState('')

  const canCompleteTicket = assignedToId === currentUserId && ticketStatus !== 'resolved'
  const canReassignTicket =
    ['service_desk_head', 'service_desk_staff', 'admin'].includes(currentUserRole) && assignedToId
  const canMessageTicket = true

  const handleCompleteTicket = async () => {
    if (!completionNotes.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please add work notes before completing the ticket',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/service-tickets/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          completedBy: currentUserId,
          completedByName: currentUserName,
          completedByRole: currentUserRole,
          workNotes: completionNotes,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete ticket')
      }

      await showNotification({
        title: 'Ticket Completed',
        description: `Ticket #${ticketNumber} submitted for user confirmation`,
        type: 'success',
        sound: true,
      })

      setCompleteDialogOpen(false)
      setCompletionNotes('')
      onActionComplete?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete ticket',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReassignTicket = async () => {
    if (!selectedReassignee) {
      toast({
        title: 'Validation Error',
        description: 'Please select a staff member to reassign to',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const reassignee = itStaffList.find(s => s.id === selectedReassignee)
      if (!reassignee) throw new Error('Selected staff member not found')

      const response = await fetch('/api/service-tickets/reassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          newAssigneeId: selectedReassignee,
          newAssignee: reassignee.full_name,
          reassignedBy: currentUserId,
          reassignedByName: currentUserName,
          reason: reassignReason,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reassign ticket')
      }

      await showNotification({
        title: 'Ticket Reassigned',
        description: `Ticket #${ticketNumber} reassigned to ${reassignee.full_name}`,
        type: 'success',
        sound: true,
      })

      setReassignDialogOpen(false)
      setSelectedReassignee('')
      setReassignReason('')
      onActionComplete?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reassign ticket',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a message',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/service-tickets/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          userId: currentUserId,
          userName: currentUserName,
          userRole: currentUserRole,
          message: messageText,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message')
      }

      await showNotification({
        title: 'Message Sent',
        description: 'Your message has been sent to ticket conversation',
        type: 'success',
        sound: true,
      })

      setMessageDialogOpen(false)
      setMessageText('')
      onActionComplete?.()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {canMessageTicket && (
            <DropdownMenuItem onClick={() => setMessageDialogOpen(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Send Message</span>
            </DropdownMenuItem>
          )}

          {canReassignTicket && (
            <DropdownMenuItem onClick={() => setReassignDialogOpen(true)}>
              <Repeat2 className="mr-2 h-4 w-4" />
              <span>Reassign Ticket</span>
            </DropdownMenuItem>
          )}

          {canCompleteTicket && (
            <DropdownMenuItem onClick={() => setCompleteDialogOpen(true)}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span>Complete Ticket</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Complete Ticket Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Ticket #{ticketNumber}</DialogTitle>
            <DialogDescription>
              Add work notes before submitting the ticket for user confirmation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="completion-notes">Work Notes</Label>
              <Textarea
                id="completion-notes"
                placeholder="Describe the work completed..."
                value={completionNotes}
                onChange={e => setCompletionNotes(e.target.value)}
                rows={5}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setCompleteDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleCompleteTicket} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassign Ticket Dialog */}
      <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Ticket #{ticketNumber}</DialogTitle>
            <DialogDescription>
              Currently assigned to: {assignedToName || 'Unassigned'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reassignee">Assign To</Label>
              <select
                id="reassignee"
                value={selectedReassignee}
                onChange={e => setSelectedReassignee(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Select a staff member...</option>
                {itStaffList.map(staff => (
                  <option key={staff.id} value={staff.id}>
                    {staff.full_name} ({staff.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="reassign-reason">Reason (Optional)</Label>
              <Textarea
                id="reassign-reason"
                placeholder="Why are you reassigning this ticket?..."
                value={reassignReason}
                onChange={e => setReassignReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setReassignDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleReassignTicket} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reassign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a message to the ticket conversation for Ticket #{ticketNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Type your message..."
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setMessageDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
