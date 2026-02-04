/**
 * Repair status and priority constants
 * Centralized definitions to avoid hardcoding across components
 */

export type RepairPriority = "low" | "medium" | "high" | "critical"
export type RepairStatus = "draft" | "assigned" | "pickup_scheduled" | "collected" | "in_repair" | "completed" | "returned" | "cancelled"
export type RequestStatus = "pending" | "approved" | "in_transit" | "with_provider" | "completed" | "rejected"

// Priority color mappings for UI badges
export const PRIORITY_COLORS: Record<RepairPriority, string> = {
  low: "outline",
  medium: "secondary",
  high: "secondary",
  critical: "destructive",
} as const

// Status color mappings for UI badges
export const STATUS_COLORS: Record<RepairStatus, string> = {
  draft: "outline",
  assigned: "secondary",
  pickup_scheduled: "secondary",
  collected: "secondary",
  in_repair: "secondary",
  completed: "default",
  returned: "default",
  cancelled: "destructive",
} as const

// Request status color mappings
export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  pending: "secondary",
  approved: "default",
  in_transit: "secondary",
  with_provider: "secondary",
  completed: "default",
  rejected: "destructive",
} as const

// Request priority color mappings
export const REQUEST_PRIORITY_COLORS: Record<"low" | "medium" | "high" | "urgent", string> = {
  low: "outline",
  medium: "secondary",
  high: "secondary",
  urgent: "destructive",
} as const

// Priority display labels
export const PRIORITY_LABELS: Record<RepairPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
} as const

// Status display labels
export const STATUS_LABELS: Record<RepairStatus, string> = {
  draft: "Draft",
  assigned: "Assigned",
  pickup_scheduled: "Pickup Scheduled",
  collected: "Collected",
  in_repair: "In Repair",
  completed: "Completed",
  returned: "Returned",
  cancelled: "Cancelled",
} as const

// Request status display labels
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  in_transit: "In Transit",
  with_provider: "With Provider",
  completed: "Completed",
  rejected: "Rejected",
} as const

// Get formatted status text
export function getStatusLabel(status: RepairStatus | RequestStatus | string): string {
  return (REQUEST_STATUS_LABELS[status as RequestStatus] || STATUS_LABELS[status as RepairStatus] || status)
}

// Get formatted priority text
export function getPriorityLabel(priority: RepairPriority | "urgent" | string): string {
  if (priority === "urgent") return "Urgent"
  return (PRIORITY_LABELS[priority as RepairPriority] || priority)
}
