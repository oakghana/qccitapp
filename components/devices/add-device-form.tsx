"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

interface Device {
  type: string
  serialNumber: string
  model: string
  brand: string
  status: string
  location: string
  assignedTo: string
  purchaseDate: string
  warrantyExpiry: string
}

interface AddDeviceFormProps {
  onSubmit: () => void
}

export function AddDeviceForm({ onSubmit }: AddDeviceFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [deviceTypes, setDeviceTypes] = useState<{ code: string; name: string }[]>([])
  const [locations, setLocations] = useState<{ code: string; name: string }[]>([])
  const supabase = createClient()

  const [formData, setFormData] = useState<Device>({
    type: "laptop",
    serialNumber: "",
    model: "",
    brand: "",
    status: "active",
    location: "head_office",
    assignedTo: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    warrantyExpiry: "",
  })

  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const typesRes = await fetch("/api/admin/lookup-data?type=device_types")
        if (typesRes.ok) {
          const types = await typesRes.json()
          const activeTypes = types.filter((t: any) => t.is_active)
          setDeviceTypes(activeTypes)
          if (activeTypes.length > 0) {
            setFormData((prev) => ({ ...prev, type: activeTypes[0].code }))
          }
        }

        const locsRes = await fetch("/api/admin/lookup-data?type=locations")
        if (locsRes.ok) {
          const locs = await locsRes.json()
          const activeLocs = locs.filter((l: any) => l.is_active)
          setLocations(activeLocs)
          if (activeLocs.length > 0) {
            setFormData((prev) => ({ ...prev, location: activeLocs[0].code }))
          }
        }
      } catch (error) {
        console.error("Error fetching lookup data:", error)
        setDeviceTypes([
          { code: "laptop", name: "Laptop" },
          { code: "desktop", name: "Desktop" },
          { code: "printer", name: "Printer" },
        ])
        setLocations([{ code: "head_office", name: "Head Office" }])
      }
    }
    fetchLookupData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data, error: insertError } = await supabase
        .from("devices")
        .insert([
          {
            device_type: formData.type,
            brand: formData.brand,
            model: formData.model,
            serial_number: formData.serialNumber,
            location: formData.location,
            assigned_to: formData.assignedTo || null,
            status: formData.status,
            purchase_date: formData.purchaseDate || null,
            warranty_expiry: formData.warrantyExpiry || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()

      if (insertError) {
        console.error("Error saving device:", insertError)
        setError(insertError.message)
        toast({
          title: "Error",
          description: insertError.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Device added successfully",
      })
      onSubmit()
    } catch (err) {
      console.error("Error:", err)
      const errorMsg = "Failed to save device"
      setError(errorMsg)
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Device, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-destructive/10 text-destructive px-4 py-2 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Device Type</Label>
          <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {deviceTypes.map((type) => (
                <SelectItem key={type.code} value={type.code}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => handleInputChange("brand", e.target.value)}
            placeholder="e.g., Dell, HP, Lenovo"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => handleInputChange("model", e.target.value)}
            placeholder="e.g., Latitude 5520"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input
            id="serialNumber"
            value={formData.serialNumber}
            onChange={(e) => handleInputChange("serialNumber", e.target.value)}
            placeholder="Device serial number"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="repair">Under Repair</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.code} value={location.code}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignedTo">Assigned To</Label>
          <Input
            id="assignedTo"
            value={formData.assignedTo}
            onChange={(e) => handleInputChange("assignedTo", e.target.value)}
            placeholder="Person or department name (optional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input
            id="purchaseDate"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
          <Input
            id="warrantyExpiry"
            type="date"
            value={formData.warrantyExpiry}
            onChange={(e) => handleInputChange("warrantyExpiry", e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Device"}
        </Button>
      </div>
    </form>
  )
}
