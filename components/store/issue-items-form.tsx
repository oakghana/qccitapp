"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface Requisition {
  id: string
  sivNumber: string
  requestedBy: string
  department: string
  items: { itemName: string; quantity: number; unit: string }[]
  requestDate: string
  status: string
}

export function IssueItemsForm({
  requisition,
  onSubmit,
  onCancel,
}: {
  requisition: Requisition
  onSubmit: () => void
  onCancel: () => void
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">Requester</Label>
            <p className="font-medium">{requisition.requestedBy}</p>
          </div>
          <div>
            <Label className="text-muted-foreground">Department</Label>
            <p className="font-medium">{requisition.department}</p>
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground mb-2 block">Items to Issue</Label>
          <div className="space-y-2">
            {requisition.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-background rounded">
                <span className="font-medium">{item.itemName}</span>
                <Badge>
                  {item.quantity} {item.unit}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Issue Notes (Optional)</Label>
        <Textarea id="notes" placeholder="Add any notes about this issuance..." rows={3} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Issue Items</Button>
      </div>
    </form>
  )
}
