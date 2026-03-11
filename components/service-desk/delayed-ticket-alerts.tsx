'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useNotification } from '@/hooks/use-notification-sound'
import {
  AlertTriangle,
  Clock,
  User,
  AlertCircle,
  Loader2,
  Send,
  CheckCircle2,
  X,
} from 'lucide-react'

interface DelayedTicket {
  id: string
  ticket_number: string
  title?: string
  requester_name: string
  assigned_to_name: string
  location_id: string
  due_date: string
  created_at: string
  status: string
}

interface DelayedTicketAlertsProps {
  currentUserId: string
  currentUserName: string
  currentUserRole: string
  userLocation?: string
}

export const DelayedTicketAlerts: React.FC<DelayedTicketAlertsProps> = ({
  currentUserId,
  currentUserName,
  currentUserRole,
  userLocation,
}) => {
  const { toast } = useToast()
  const { showNotification } = useNotification()
  const [delayedTickets, setDelayedTickets] = useState<DelayedTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<DelayedTicket | null>(null)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    fetchDelayedTickets()
    // Check for delayed tickets every 5 minutes
    const interval = setInterval(fetchDelayedTickets, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [currentUserRole, userLocation])

  const fetchDelayedTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        userRole: currentUserRole,
      })
      if (userLocation) {
        params.append('userLocation', userLocation)
      }

      const response = await fetch(`/api/service-tickets/delayed-alerts?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch delayed tickets')
      }

      const result = await response.json()
      setDelayedTickets(result.delayedTickets || [])

      // If there are new delayed tickets, show a notification
      if (result.count > 0) {
        await showNotification({
          title: 'Delayed Tickets Alert',
          description: `${result.count} ticket(s) are now overdue by 1+ day`,
          type: 'warning',
          sound: true,
        })
      }
    } catch (error) {
      console.error('Error fetching delayed tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedTicket) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a message',
        variant: 'destructive',
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/service-tickets/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          userId: currentUserId,
          userName: currentUserName,
          userRole: currentUserRole,
          message: messageText,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      await showNotification({
        title: 'Message Sent',
        description: `Message sent regarding delayed ticket #${selectedTicket.ticket_number}`,
        type: 'success',
        sound: true,
      })

      setMessageText('')
      setMessageDialogOpen(false)
      setSelectedTicket(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleDismissAlert = async (ticket: DelayedTicket) => {
    try {
      const response = await fetch('/api/service-tickets/delayed-alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to dismiss alert')
      }

      setDelayedTickets(delayedTickets.filter(t => t.id !== ticket.id))
      toast({
        title: 'Alert Dismissed',
        description: `Alert for ticket #${ticket.ticket_number} dismissed`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to dismiss alert',
        variant: 'destructive',
      })
    }
  }

  if (delayedTickets.length === 0 && !loading) {
    return null
  }

  return (
    <>
      <Card className="border-red-200/50 bg-gradient-to-r from-red-50/50 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
                <AlertTriangle className="h-5 w-5" />
                Delayed Tickets Alert
              </CardTitle>
              <CardDescription>
                {delayedTickets.length} ticket(s) are overdue by 1+ day
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDelayedTickets}
              disabled={loading}
              className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertCircle className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {delayedTickets.map(ticket => (
              <div
                key={ticket.id}
                className="flex items-start justify-between p-3 rounded-lg border border-red-200/50 bg-white/50 dark:bg-slate-950/50 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="flex h-2 w-2 rounded-full bg-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-red-900 dark:text-red-100">
                          Ticket #{ticket.ticket_number}
                        </p>
                        <Badge variant="destructive" className="text-xs">
                          OVERDUE
                        </Badge>
                      </div>
                      <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          <span>
                            Requester: {ticket.requester_name} | Assigned: {ticket.assigned_to_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>Due: {new Date(ticket.due_date).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
                    onClick={() => {
                      setSelectedTicket(ticket)
                      setMessageDialogOpen(true)
                    }}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Message
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDismissAlert(ticket)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Send Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message About Delayed Ticket</DialogTitle>
            <DialogDescription>
              {selectedTicket && (
                <span>
                  Ticket #{selectedTicket.ticket_number} - Requester: {selectedTicket.requester_name}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="delay-message">Message</Label>
              <Textarea
                id="delay-message"
                placeholder="Send a status update or ask about the delayed ticket..."
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setMessageDialogOpen(false)
                  setMessageText('')
                  setSelectedTicket(null)
                }}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button onClick={handleSendMessage} disabled={isSending}>
                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
