"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, FileText } from "lucide-react"
import { FormNavigation } from "@/components/ui/form-navigation"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { canSeeAllLocations, canCreateRepairs, applyLocationFilter } from "@/lib/location-filter"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"

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
  onSubmit: (
    request: Omit<RepairRequest, "id" | "requestedBy" | "requestedDate" | "status" | "location" | "locationName">,
  ) => void
}

const mockDevices = [
  { id: "DL-2024-001", name: "Dell Latitude 5520", location: "accra" as const },
  { id: "HP-2024-045", name: "HP LaserJet Pro", location: "head_office" as const },
  { id: "LD-2024-012", name: "Lenovo ThinkCentre", location: "kumasi" as const },
  { id: "IP-2024-008", name: "iPhone 13", location: "kaase_inland_port" as const },
]

export function NewRepairRequestForm({ onSubmit }: NewRepairRequestFormProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    deviceId: "",
    deviceName: "",
    description: "",
    priority: "medium" as const,
    attachments: [] as string[],
  })

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [searchField, setSearchField] = useState<"location" | "type" | "name" | "serial_number" | "assigned_to">("location")
  const [searchQuery, setSearchQuery] = useState("")

  const canCreate = user && canCreateRepairs(user)

  useEffect(() => {
    loadDevices()
  }, [user])

  const loadDevices = async (queryField?: string, queryValue?: string) => {
    if (!user) return

    setLoading(true)
    try {
      let query: any = supabase.from("devices").select("*")

      // Always apply location filter first
      if (!canSeeAllLocations(user) && user.location) {
        query = applyLocationFilter(query, user, "location")
      }

      // Apply search filter if provided
      if (queryValue) {
        let field = queryField
        // If the query looks like a device tag, search asset_tag, id, and serial_number
        if (/^[A-Z0-9]{6,}$/.test(queryValue)) {
          query = query.or(`asset_tag.ilike.%${queryValue}%,id.ilike.%${queryValue}%,serial_number.ilike.%${queryValue}%`)
        } else if (field) {
          // For assigned_to, search both assigned_to and assigned_user fields if available
          if (field === "assigned_to") {
            query = query.or(`assigned_to.ilike.%${queryValue}%,assigned_user.ilike.%${queryValue}%`)
          } else {
            query = query.ilike(field, `%${queryValue}%`)
          }
        }
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error loading devices:", error)
        return
      }

      // Only include devices from the user's assigned region (exclude Central Stores and others)
      let filtered = data || []
      if (!canSeeAllLocations(user) && user.location) {
        const { getLocationAliases, locationsMatch, normalizeLocation } = await import("@/lib/location-filter")
        const aliases = getLocationAliases(user.location)
        const normalizedAliases = aliases.map(normalizeLocation)
        const normalizedUserLoc = normalizeLocation(user.location)
        filtered = filtered.filter((d: any) => {
          const deviceLoc = normalizeLocation(d.location)
          return normalizedAliases.includes(deviceLoc) || deviceLoc === normalizedUserLoc
        })
      }
      setDevices(filtered)
    } catch (error) {
      console.error("[v0] Error loading devices:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
    const device = devices.find((d) => d.id === deviceId)
    if (device) {
      setFormData((prev) => ({
        ...prev,
        deviceId: device.id,
        deviceName: device.name || `${device.type} - ${device.model}`,
      }))
    }
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    // Trim query
    const q = (searchQuery || "").trim()
    if (!q) {
      loadDevices()
      return
    }
    // If query looks like a device tag, ignore searchField and search by asset_tag/id
    if (/^[A-Z0-9]{6,}$/.test(q)) {
      await loadDevices(undefined, q)
    } else {
      await loadDevices(searchField, q)
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

      {!canCreate && (
        <Alert variant="destructive" className="mb-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Admins, IT Staff, IT leads, and Regional IT Heads can create repair requests. Other users can view existing repairs.
            For IT support, please submit a service desk ticket.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Search Devices</Label>
            <div className="flex space-x-2">
              <Select value={searchField} onValueChange={(v) => setSearchField(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="name">Device Name</SelectItem>
                  <SelectItem value="serial_number">Serial Number</SelectItem>
                  <SelectItem value="assigned_to">Assigned User</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Search query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch()
                }}
              />
              <Button type="button" onClick={() => handleSearch()}>
                Search
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setSearchQuery(""); loadDevices(); }}>
                Clear
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="device">Select Device</Label>
            <Select value={formData.deviceId} onValueChange={handleDeviceSelect} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading devices..." : "Choose a device"} />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    {device.name || `${device.type} - ${device.model}`} ({device.asset_tag || device.id})
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
          <Button type="submit" disabled={!formData.deviceId || !formData.description || !canCreate}>
            Submit Repair Request
          </Button>
        </div>
      </form>
    </div>
  )
}
