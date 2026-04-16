"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface UpdateRepairStatusModalProps {
  repair: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function UpdateRepairStatusModal({
  repair,
  open,
  onOpenChange,
  onSuccess,
}: UpdateRepairStatusModalProps) {
  const [status, setStatus] = useState(repair.status || "assigned")
  const [actualCost, setActualCost] = useState(repair.actual_cost?.toString() || "")
  const [notes, setNotes] = useState(repair.work_notes || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      const response = await fetch("/api/repairs/confirm-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repairTaskId: repair.id,
          status,
          actualCost: actualCost ? parseFloat(actualCost) : null,
          notes,
          workCompletedAt:
            status === "completed" || status === "returned"
              ? new Date().toISOString()
              : null,
          confirmedBy: "service_provider",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to update repair status",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: `Repair status updated to ${status}`,
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("[v0] Error updating repair:", error)
      toast({
        title: "Error",
        description: "Failed to update repair status",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Update Repair Status - {repair.task_number}</DialogTitle>
          <DialogDescription>
            Update the status and details of this repair job
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="rounded-lg bg-blue-50 p-3 text-sm">
            <p className="text-muted-foreground">Current Status</p>
            <p className="font-medium capitalize">{repair.status.replace(/_/g, " ")}</p>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Update Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assigned">Assigned (Not Started)</SelectItem>
                <SelectItem value="in_transit">In Transit (To Workshop)</SelectItem>
                <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
                <SelectItem value="in_progress">In Progress (Work Started)</SelectItem>
                <SelectItem value="quality_check">Quality Check</SelectItem>
                <SelectItem value="completed">Completed (Ready for Pickup)</SelectItem>
                <SelectItem value="returned">Returned (Device Collected)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actual Cost (only show if status is completed or returned) */}
          {(status === "completed" || status === "returned") && (
            <div className="space-y-2">
              <Label htmlFor="actualCost">Actual Repair Cost</Label>
              <Input
                id="actualCost"
                type="number"
                placeholder="Enter actual cost (optional)"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
                min="0"
                step="100"
              />
              <p className="text-xs text-muted-foreground">
                Estimated cost: ₦
                {repair.estimated_cost?.toLocaleString() || "Not specified"}
              </p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Work Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about the repair work, issues found, parts replaced, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Status Specific Info */}
          {status === "in_transit" && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm">
              <p className="font-medium text-blue-900">Device In Transit</p>
              <p className="text-blue-800">
                Device is being transported to your workshop
              </p>
            </div>
          )}

          {status === "awaiting_parts" && (
            <div className="rounded-lg bg-yellow-50 p-3 text-sm">
              <p className="font-medium text-yellow-900">Awaiting Parts</p>
              <p className="text-yellow-800">
                Work is on hold pending arrival of replacement parts
              </p>
            </div>
          )}

          {status === "in_progress" && (
            <div className="rounded-lg bg-purple-50 p-3 text-sm">
              <p className="font-medium text-purple-900">Work Started</p>
              <p className="text-purple-800">
                The work start time will be recorded automatically
              </p>
            </div>
          )}

          {status === "quality_check" && (
            <div className="rounded-lg bg-indigo-50 p-3 text-sm">
              <p className="font-medium text-indigo-900">Quality Check</p>
              <p className="text-indigo-800">
                Repair work is complete and undergoing quality verification
              </p>
            </div>
          )}

          {status === "completed" && (
            <div className="rounded-lg bg-green-50 p-3 text-sm">
              <p className="font-medium text-green-900">Ready for Pickup</p>
              <p className="text-green-800">
                Mark this when repair work is finished and device is ready to be collected
              </p>
            </div>
          )}

          {status === "returned" && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p className="font-medium text-gray-900">Device Returned</p>
              <p className="text-gray-800">
                Mark this when device has been collected and returned to the owner
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
