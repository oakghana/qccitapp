"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Clock } from "lucide-react"

interface TicketConfirmationStatusProps {
  ticket: any
}

export function TicketConfirmationStatus({ ticket }: TicketConfirmationStatusProps) {
  if (!ticket) return null

  return (
    <div className="space-y-2">
      {ticket.status === "awaiting_confirmation" && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-600" />
              Awaiting User Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-amber-900 dark:text-amber-100">
              The IT staff has marked this ticket as complete. The user has been notified and is reviewing the work.
            </p>
            {ticket.completion_work_notes && (
              <div className="mt-2 bg-white dark:bg-gray-900/50 p-2 rounded text-xs">
                <p className="font-semibold mb-1">Work Summary:</p>
                <p className="text-gray-700 dark:text-gray-300">{ticket.completion_work_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {ticket.user_confirmed && ticket.confirmation_status === "approved" && (
        <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Confirmed & Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-green-900 dark:text-green-100">
              ✓ User has confirmed that the work is satisfactory
            </p>
            {ticket.confirmation_notes && (
              <div className="mt-2 bg-white dark:bg-gray-900/50 p-2 rounded text-xs">
                <p className="font-semibold mb-1">User Feedback:</p>
                <p className="text-gray-700 dark:text-gray-300">{ticket.confirmation_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {ticket.user_confirmed && ticket.confirmation_status === "rejected" && (
        <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Sent Back for Rework
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-red-900 dark:text-red-100">
              The user has rejected the work and requested rework
            </p>
            {ticket.confirmation_notes && (
              <div className="mt-2 bg-white dark:bg-gray-900/50 p-2 rounded text-xs">
                <p className="font-semibold mb-1">Issues Reported:</p>
                <p className="text-gray-700 dark:text-gray-300">{ticket.confirmation_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
