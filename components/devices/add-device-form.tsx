"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormNavigation } from "@/components/ui/form-navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

interface Device {
  type: "laptop" | "desktop" | "printer" | "ups" | "stabiliser" | "mobile" | "server" | "other"
  serialNumber: string
  model: string
  brand: string
  status: "active" | "repair" | "maintenance" | "retired"
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
    location: "",
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
          console.log("[v0] Loaded device types:", types)
          const activeTypes = types.filter((t: any) => t.is_active)
          setDeviceTypes(activeTypes)
          if (activeTypes.length > 0) {
            setFormData((prev) => ({ ...prev, type: activeTypes[0].code }))
          }
        } else {
          console.error("[v0] Failed to load device types:", typesRes.status)
        }

        const locsRes = await fetch("/api/admin/lookup-data?type=locations")
        if (locsRes.ok) {
          const locs = await locsRes.json()
          console.log("[v0] Loaded locations:", locs)
          const activeLocs = locs.filter((l: any) => l.is_active)
          setLocations(activeLocs)
          if (activeLocs.length > 0 && !formData.location) {
            setFormData((prev) => ({ ...prev, location: activeLocs[0].code }))
          }
        } else {
          console.error("[v0] Failed to load locations:", locsRes.status)
        }
      } catch (error) {
        console.error("[v0] Error fetching lookup data:", error)
        toast({
          title: "Warning",
          description: "Could not load device types and locations. Using defaults.",
          variant: "destructive",
        })
      }
    }
    fetchLookupData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("[v0] Saving device to Supabase:", formData)

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
        console.error("[v0] Error saving device:", insertError)
        setError(insertError.message)
        toast({
          title: "Error",
          description: insertError.message,
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Device saved successfully:", data)
      toast({
        title: "Success",
        description: "Device added successfully",
      })
      onSubmit()
    } catch (err) {
      console.error("[v0] Error:", err)
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
    <div>
      <FormNavigation currentPage="/dashboard/devices" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-destructive/10 text-destructive px-4 py-2 rounded">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Device Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                {deviceTypes.length > 0 ? (
                  deviceTypes.map((type) => (
                    <SelectItem key={type.code} value={type.code}>
                      {type.name}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                    <SelectItem value="printer">Printer</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="stabiliser">Stabiliser</SelectItem>
                    <SelectItem value="mobile">Mobile Device</SelectItem>
                    <SelectItem value="server">Server</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </>
                )}
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
            <Label htmlFor="location">Location *</Label>
            <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.length > 0 ? (
                  locations.map((loc) => (
                    <SelectItem key={loc.code} value={loc.code}>
                      {loc.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="head_office">Head Office</SelectItem>
                )}
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
    </div>
  )
}
