"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, FileText } from "lucide-react"
import { FormNavigation } from "@/components/ui/form-navigation"

interface RepairRequest {
  deviceId: string
  deviceName: string
  requestedBy: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  attachments: string[]
  location: "head_office" | "kumasi" | "accra" | "kaase_inland_port" | "cape_coast"
}

interface NewRepairRequestFormProps {
  onSubmit: (request: Omit<RepairRequest, "id" | "requestedBy" | "requestedDate" | "status" | "location" | "locationName">) => void
}

// Mock device data - in real app, this would come from the device inventory
const mockDevices = [
  { id: "DL-2024-001", name: "Dell Latitude 5520", location: "accra" as const },
  { id: "HP-2024-045", name: "HP LaserJet Pro", location: "head_office" as const },
  { id: "LD-2024-012", name: "Lenovo ThinkCentre", location: "kumasi" as const },
  { id: "IP-2024-008", name: "iPhone 13", location: "kaase_inland_port" as const },
]

export function NewRepairRequestForm({ onSubmit }: NewRepairRequestFormProps) {
  const [formData, setFormData] = useState({
    deviceId: "",
    deviceName: "",
    description: "",
    priority: "medium" as const,
    attachments: [] as string[],
  })

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would upload files here and get their URLs
    const attachmentNames = selectedFiles.map((file) => file.name)
    onSubmit({
      ...formData,
      attachments: attachmentNames,
    })
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDeviceSelect = (deviceId: string) => {
    const device = mockDevices.find((d) => d.id === deviceId)
    if (device) {
      setFormData((prev) => ({
        ...prev,
        deviceId: device.id,
        deviceName: device.name,
      }))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      <FormNavigation currentPage="/dashboard/repairs" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="device">Select Device</Label>
            <Select value={formData.deviceId} onValueChange={handleDeviceSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a device" />
              </SelectTrigger>
              <SelectContent>
                {mockDevices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    {device.name} ({device.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Problem Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Describe the issue with the device in detail..."
            rows={4}
            required
          />
        </div>

        {/* File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attachments</CardTitle>
            <CardDescription>Upload repair forms, photos, or diagnostic reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Click to upload files or drag and drop</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB each</p>
              </div>
              <Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="mt-2" />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files:</Label>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={!formData.deviceId || !formData.description}>
            Submit Repair Request
          </Button>
        </div>
      </form>
    </div>
  )
}
