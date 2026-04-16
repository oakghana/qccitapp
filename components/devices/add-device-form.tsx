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
import { deviceLocationService } from "@/lib/device-location-service"
import { AlertCircle } from "lucide-react"
import { notificationService } from "@/lib/notification-service"

interface Device {
  type: "laptop" | "desktop" | "printer" | "photocopier" | "handset" | "ups" | "stabiliser" | "mobile" | "server" | "other"
  serialNumber: string
  assetTag: string
  model: string
  brand: string
  status: "active" | "repair" | "maintenance" | "retired"
  location: string
  region: string
  district: string
  assignedTo: string
  purchaseDate: string
  warrantyExpiry: string
  roomNumber: string
  building: string
  floor: string
  // Printer-specific fields
  tonerType: string
  tonerModel: string
  tonerYield: string
  monthlyPrintVolume: string
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
  const [duplicateWarning, setDuplicateWarning] = useState<string>("")
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false)
  const supabase = createClient()
  
  // Check if user can select all locations or is restricted to their own
  const canSelectAllLocations = user ? canSeeAllLocations(user) : false

  const [formData, setFormData] = useState<Device>({
    type: "laptop",
    serialNumber: "",
    assetTag: "",
    model: "",
    brand: "",
    status: "active",
    location: user?.location || "",  // Pre-select user's location
    region: "",
    district: "",
    assignedTo: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    warrantyExpiry: "",
    roomNumber: "",
    building: "",
    floor: "",
    tonerType: "",
    tonerModel: "",
    tonerYield: "",
    monthlyPrintVolume: "",
  })

  // Ensure user's location is always set - this happens automatically now
  useEffect(() => {
    if (user?.location) {
      setFormData((prev) => ({ ...prev, location: user.location }))
      console.log("[v0] Device will be added to user location:", user.location)
    }
  }, [user?.location])

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
          
          // Ensure user's location is pre-selected if available
          if (user?.location && !formData.location) {
            setFormData((prev) => ({ ...prev, location: user.location }))
            console.log("[v0] Auto-selected user location:", user.location)
          }
          
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

    // If duplicate warning exists and not confirmed, show confirmation dialog
    if (duplicateWarning && !showDuplicateConfirm) {
      setShowDuplicateConfirm(true)
      return
    }

    // Reset the confirmation flag
    setShowDuplicateConfirm(false)

    // Location is automatically set to user's location - no validation needed
    // Ensure user has a location
    if (!user?.location || user.location.trim() === "") {
      setError("Your user account does not have a location assigned. Please contact the administrator.")
      notificationService.error("Location Not Assigned", "Your user account does not have a location assigned. Please contact the administrator.")
      return
    }

    // Validate printer/photocopier-specific fields
    if ((formData.type === "printer" || formData.type === "photocopier") && !formData.tonerType) {
      setError(`Toner type is required for ${formData.type}s.`)
      notificationService.error(`Validation Failed`, `Toner type is required for ${formData.type}s.`)
      return
    }

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
          asset_tag: formData.assetTag || null,
          location: user?.location, // Always use the logged-in user's location
          region_id: null, // Region not used - devices inherit user's location only
          district_id: null, // District is managed separately and not required for device creation
          assigned_to: formData.assignedTo || null,
          status: formData.status,
          purchase_date: formData.purchaseDate || null,
          warranty_expiry: formData.warrantyExpiry || null,
          room_number: formData.roomNumber || null,
          building: formData.building || null,
          floor: formData.floor || null,
          toner_type: formData.tonerType || null,
          toner_model: formData.tonerModel || null,
          toner_yield: formData.tonerYield ? parseInt(formData.tonerYield) : null,
          monthly_print_volume: formData.monthlyPrintVolume ? parseInt(formData.monthlyPrintVolume) : null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error saving device:", errorData)
        setError(errorData.error || "Failed to save device")
        notificationService.error("Device Creation Failed", errorData.error || "Failed to save device")
        return
      }

      const data = await response.json()
      console.log("[v0] Device saved successfully:", data)
      notificationService.success(
        "Device Added Successfully",
        `${formData.brand} ${formData.model} has been added to ${user?.location}`
      )
      onSubmit()
    } catch (err) {
      console.error("[v0] Error:", err)
      const errorMsg = "Failed to save device"
      setError(errorMsg)
      notificationService.error("Error", errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof Device, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Check for duplicates when serial number changes
    if (field === "serialNumber" && value && user?.location) {
      checkForDuplicateLocation(value)
    }
  }

  const checkForDuplicateLocation = async (serialNumber: string) => {
    try {
      const duplicate = await deviceLocationService.checkDuplicateLocation(
        serialNumber,
        user?.location || ""
      )
      
      if (duplicate) {
        setDuplicateWarning(
          `Device with serial number "${serialNumber}" already exists at ${user?.location}: ${duplicate.brand} ${duplicate.model}`
        )
      } else {
        setDuplicateWarning("")
      }
    } catch (error) {
      console.error("[v0] Error checking duplicate:", error)
      setDuplicateWarning("")
    }
  }

  return (
    <div>
      <FormNavigation currentPage="/dashboard/devices" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-destructive/10 text-destructive px-4 py-2 rounded">{error}</div>}

        {duplicateWarning && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-amber-900 font-medium">Duplicate Device Warning</p>
              <p className="text-sm text-amber-800 mt-1">{duplicateWarning}</p>
              {showDuplicateConfirm && (
                <p className="text-xs text-amber-700 mt-2 italic">Click "Add Device" again to confirm adding this duplicate.</p>
              )}
            </div>
          </div>
        )}

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
                  <SelectItem value="photocopier">Photocopier</SelectItem>
                  <SelectItem value="handset">Handset</SelectItem>
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
            <Label htmlFor="assetTag">Asset Tag</Label>
            <Input
              id="assetTag"
              value={formData.assetTag}
              onChange={(e) => handleInputChange("assetTag", e.target.value)}
              placeholder="e.g., QCC-IT-001"
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
                <SelectItem value="maintenance">Under Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location is automatically set to user's location - hidden from UI */}
          <div className="space-y-2 bg-muted/50 p-3 rounded-md border">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Device Location:</Label>
              <span className="text-sm font-semibold text-primary">
                {locations.find(l => l.code === user?.location)?.name || user?.location || "Not set"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Devices are automatically added to your assigned location
            </p>
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

          <div className="space-y-2">
            <Label htmlFor="roomNumber">Room Number</Label>
            <Input
              id="roomNumber"
              value={formData.roomNumber}
              onChange={(e) => handleInputChange("roomNumber", e.target.value)}
              placeholder="e.g., Room 204"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="building">Building</Label>
            <Input
              id="building"
              value={formData.building}
              onChange={(e) => handleInputChange("building", e.target.value)}
              placeholder="e.g., Main Block, Admin Building"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="floor">Floor</Label>
            <Input
              id="floor"
              value={formData.floor}
              onChange={(e) => handleInputChange("floor", e.target.value)}
              placeholder="e.g., 1st Floor, Ground Floor"
            />
          </div>
        </div>

        {/* Printer/Photocopier-Specific Fields */}
        {(formData.type === "printer" || formData.type === "photocopier") && (
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-4">
              {formData.type === "printer" ? "Printer" : "Photocopier"} Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tonerType">Toner Type *</Label>
                <Input
                  id="tonerType"
                  value={formData.tonerType}
                  onChange={(e) => handleInputChange("tonerType", e.target.value)}
                  placeholder="e.g., CF217A, 85A, TN-2420"
                  required={formData.type === "printer" || formData.type === "photocopier"}
                />
                <p className="text-xs text-muted-foreground">Enter the toner/cartridge model/type</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tonerModel">Toner Model/Brand</Label>
                <Input
                  id="tonerModel"
                  value={formData.tonerModel}
                  onChange={(e) => handleInputChange("tonerModel", e.target.value)}
                  placeholder="e.g., HP LaserJet, Brother TN"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tonerYield">Toner Yield (pages)</Label>
                <Input
                  id="tonerYield"
                  type="number"
                  value={formData.tonerYield}
                  onChange={(e) => handleInputChange("tonerYield", e.target.value)}
                  placeholder="e.g., 1600, 3000"
                />
                <p className="text-xs text-muted-foreground">Approximate pages per toner cartridge</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyPrintVolume">Monthly Print Volume</Label>
                <Input
                  id="monthlyPrintVolume"
                  type="number"
                  value={formData.monthlyPrintVolume}
                  onChange={(e) => handleInputChange("monthlyPrintVolume", e.target.value)}
                  placeholder="e.g., 500, 1000"
                />
                <p className="text-xs text-muted-foreground">Average pages printed per month</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Add Device"}
          </Button>
        </div>
      </form>
    </div>
  )
}
