"use client"

import { AssignedTasksDashboard } from "@/components/assigned-tasks/assigned-tasks-dashboard"
import { useTicketNotifications } from "@/hooks/use-ticket-notifications"

export default function AssignedTasksPage() {
  useTicketNotifications()

  return <AssignedTasksDashboard />
}
