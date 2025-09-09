"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface Device {
  id: string
  name: string
  location: string
  assignedTo: string
}

interface DeviceTransferFormProps {
  device: Device
  onSubmit: (deviceId: string, newLocation: string, newAssignee: string) => void
  onCancel: () => void
}

export function DeviceTransferForm({ device, onSubmit, onCancel }: DeviceTransferFormProps) {
  const [newLocation, setNewLocation] = useState(device.location)
  const [newAssignee, setNewAssignee] = useState(device.assignedTo)
  const [transferReason, setTransferReason] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(device.id, newLocation, newAssignee)
  }

  const locationNames = {
    head_office: "Head Office",
    accra: "Accra",
    kumasi: "Kumasi",
    kaase_inland_port: "Kaase Inland Port",
    cape_coast: "Cape Coast",
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium text-foreground mb-2">Current Assignment</h4>
          <p className="text-sm text-muted-foreground">
            <strong>Location:</strong> {locationNames[device.location as keyof typeof locationNames]}
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Assigned To:</strong> {device.assignedTo}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newLocation">New Location</Label>
          <Select value={newLocation} onValueChange={setNewLocation}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="head_office">Head Office</SelectItem>
              <SelectItem value="accra">Accra</SelectItem>
              <SelectItem value="kumasi">Kumasi</SelectItem>
              <SelectItem value="kaase_inland_port">Kaase Inland Port</SelectItem>
              <SelectItem value="cape_coast">Cape Coast</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="newAssignee">New Assignee</Label>
          <Input
            id="newAssignee"
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            placeholder="Person or department name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transferReason">Transfer Reason (Optional)</Label>
          <Textarea
            id="transferReason"
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            placeholder="Reason for device transfer..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Transfer Device</Button>
      </div>
    </form>
  )
}
