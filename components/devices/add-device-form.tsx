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
import { useAuth } from "@/lib/auth-context"
import { canSeeAllLocations } from "@/lib/location-filter"

interface Device {
  type: "laptop" | "desktop" | "printer" | "ups" | "stabiliser" | "mobile" | "server" | "other"
  serialNumber: string
  model: string
  brand: string
  status: "active" | "repair" | "maintenance" | "retired"
  location: string
  region: string
  district: string
  assignedTo: string
  purchaseDate: string
  warrantyExpiry: string
}

interface AddDeviceFormProps {
  onSubmit: () => void
}

export function AddDeviceForm({ onSubmit }: AddDeviceFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [deviceTypes, setDeviceTypes] = useState<{ code: string; name: string }[]>([])
  const [locations, setLocations] = useState<{ code: string; name: string; region_id?: string }[]>([])
  const [regions, setRegions] = useState<{ id: string; name: string; code: string }[]>([])
  const [districts, setDistricts] = useState<{ id: string; name: string; region_id?: string }[]>([])
  const supabase = createClient()
  
  // Check if user can select all locations or is restricted to their own
  const canSelectAllLocations = user ? canSeeAllLocations(user) : false

  const [formData, setFormData] = useState<Device>({
    type: "laptop",
    serialNumber: "",
    model: "",
    brand: "",
    status: "active",
    location: user?.location || "",  // Pre-select user's location
    region: "",
    district: "",
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
          const activeLocs = locs.filter((l: any) => l.is_active).map((l: any) => ({
            code: l.code,
            name: l.name,
            region_id: l.region_id || null
          }))
          setLocations(activeLocs)
          
          // If user has a location and can't see all locations, use their location
          // Otherwise, default to first location in list
          if (user?.location && !canSelectAllLocations) {
            // Find matching location in list (case-insensitive)
            const matchingLoc = activeLocs.find((l: any) => 
              l.code?.toLowerCase() === user.location.toLowerCase() ||
              l.name?.toLowerCase() === user.location.toLowerCase()
            )
            if (matchingLoc) {
              setFormData((prev) => ({ ...prev, location: matchingLoc.code }))
            } else {
              // Use user's location directly if not found in list
              setFormData((prev) => ({ ...prev, location: user.location }))
            }
          } else if (activeLocs.length > 0 && !formData.location) {
            setFormData((prev) => ({ ...prev, location: activeLocs[0].code }))
          }
        } else {
          console.error("[v0] Failed to load locations:", locsRes.status)
        }

        // Load regions
        const regionsRes = await fetch("/api/admin/lookup-data?type=regions")
        if (regionsRes.ok) {
          const regs = await regionsRes.json()
          console.log("[v0] Loaded regions:", regs)
          setRegions(regs.filter((r: any) => r.is_active !== false))
        } else {
          console.error("[v0] Failed to load regions:", regionsRes.status)
        }

        // Load districts
        const districtsRes = await fetch("/api/admin/lookup-data?type=districts")
        if (districtsRes.ok) {
          const dts = await districtsRes.json()
          console.log("[v0] Loaded districts:", dts)
          setDistricts(dts.filter((d: any) => d.is_active !== false))
        } else {
          console.error("[v0] Failed to load districts:", districtsRes.status)
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

  // Auto-populate region when location changes
  const handleLocationChange = (locationCode: string) => {
    const selectedLocation = locations.find(loc => loc.code === locationCode)
    const newRegionId = selectedLocation?.region_id || ""
    setFormData(prev => ({
      ...prev,
      location: locationCode,
      region: newRegionId,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log("[v0] Saving device via API:", formData)

      // Use API endpoint to bypass RLS issues
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_type: formData.type,
          brand: formData.brand,
          model: formData.model,
          serial_number: formData.serialNumber,
          location: formData.location,
          region_id: formData.region || null,
          district_id: formData.district || null,
          assigned_to: formData.assignedTo || null,
          status: formData.status,
          purchase_date: formData.purchaseDate || null,
          warranty_expiry: formData.warrantyExpiry || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error saving device:", errorData)
        setError(errorData.error || "Failed to save device")
        toast({
          title: "Error",
          description: errorData.error || "Failed to save device",
          variant: "destructive",
        })
        return
      }

      const data = await response.json()
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
            <Label htmlFor="location">Location *{!canSelectAllLocations && user?.location && <span className="text-muted-foreground text-sm ml-2">(Your location)</span>}</Label>
            <Select 
              value={formData.location} 
              onValueChange={handleLocationChange}
              disabled={!canSelectAllLocations && !!user?.location}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {!canSelectAllLocations && user?.location ? (
                  // Show only user's location for non-admin users
                  <SelectItem value={formData.location || user.location}>
                    {locations.find(l => l.code === formData.location || l.code === user.location)?.name || user.location}
                  </SelectItem>
                ) : locations.length > 0 ? (
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
            <Label htmlFor="region">Region</Label>
            <Select 
              value={formData.region} 
              onValueChange={(value) => handleInputChange("region", value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- No Region --</SelectItem>
                {regions.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Auto-populated from location, or select manually</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="district">District</Label>
            <Select
              value={formData.district}
              onValueChange={(value) => handleInputChange("district", value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select district" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- No District --</SelectItem>
                {districts
                  .filter((d) => !formData.region || d.region_id === formData.region)
                  .map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Optional. Choose a district.</p>
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
