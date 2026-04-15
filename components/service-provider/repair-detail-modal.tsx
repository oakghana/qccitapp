"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { Calendar, DollarSign, FileText, Wrench } from "lucide-react"

interface RepairDetailModalProps {
  repair: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RepairDetailModal({
  repair,
  open,
  onOpenChange,
}: RepairDetailModalProps) {
  const deviceInfo = repair.device_info || {}

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive"
      case "high":
        return "secondary"
      case "medium":
        return "outline"
      case "low":
        return "default"
      default:
        return "outline"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Repair Details - {repair.task_number}</DialogTitle>
          <DialogDescription>
            Device repair information and timeline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Device Information */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Wrench className="h-4 w-4" />
              Device Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Device Type</p>
                <p className="font-medium">{deviceInfo.device_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Brand & Model</p>
                <p className="font-medium">
                  {deviceInfo.brand} {deviceInfo.model}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Serial Number</p>
                <p className="font-medium">{deviceInfo.serial_number || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Priority</p>
                <Badge variant={getPriorityColor(repair.priority)} className="mt-1">
                  {repair.priority}
                </Badge>
              </div>
            </div>
          </div>

          {/* Issue Description */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <FileText className="h-4 w-4" />
              Issue Description
            </h3>
            <p className="text-sm">{repair.issue_description}</p>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <Calendar className="h-4 w-4" />
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Assigned Date</span>
                <span className="text-sm font-medium">
                  {format(new Date(repair.assigned_date), "dd MMM yyyy, HH:mm")}
                </span>
              </div>
              {repair.work_started_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Work Started</span>
                  <span className="text-sm font-medium">
                    {format(new Date(repair.work_started_at), "dd MMM yyyy, HH:mm")}
                  </span>
                </div>
              )}
              {repair.work_completed_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Work Completed</span>
                  <span className="text-sm font-medium">
                    {format(new Date(repair.work_completed_at), "dd MMM yyyy, HH:mm")}
                  </span>
                </div>
              )}
              {repair.confirmed_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Confirmed</span>
                  <span className="text-sm font-medium">
                    {format(new Date(repair.confirmed_at), "dd MMM yyyy, HH:mm")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cost Information */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 flex items-center gap-2 font-semibold">
              <DollarSign className="h-4 w-4" />
              Cost Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estimated Cost</span>
                <span className="text-sm font-medium">
                  {repair.estimated_cost
                    ? `₦${repair.estimated_cost.toLocaleString()}`
                    : "Not specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Actual Cost</span>
                <span className="text-sm font-medium">
                  {repair.actual_cost
                    ? `₦${repair.actual_cost.toLocaleString()}`
                    : "Not yet entered"}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {repair.notes && (
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-semibold">Notes</h3>
              <p className="text-sm text-muted-foreground">{repair.notes}</p>
            </div>
          )}

          {/* Assigned User */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-2 text-sm text-muted-foreground">Assigned to User</h3>
            <div>
              <p className="font-medium">
                {repair.devices?.profiles?.full_name || "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">
                {repair.devices?.profiles?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
