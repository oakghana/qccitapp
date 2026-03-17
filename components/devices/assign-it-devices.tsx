"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StaffMember {
  id: string
  full_name: string
  email: string
  role: string
  location?: string
  department?: string
}

interface Device {
  id: string
  serial_number: string
  asset_tag?: string
  device_type: string
  brand: string
  model: string
  location?: string
  assigned_to?: string
  assigned_to_user_id?: string
}

export function AssignITDevicesComponent() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [deviceSearch, setDeviceSearch] = useState("")
  const [staffSearch, setStaffSearch] = useState("")

  // Load devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const response = await fetch(
          `/api/devices?canSeeAll=true&field=serial`,
          {
            method: "GET",
          }
        )
        const data = await response.json()
        if (data.devices) {
          // Filter out devices already assigned
          const unassignedDevices = data.devices.filter(
            (d: Device) => !d.assigned_to_user_id
          )
          setDevices(unassignedDevices)
        }
      } catch (err: any) {
        console.error("[v0] Error loading devices:", err)
        setError("Failed to load devices")
      } finally {
        setLoading(false)
      }
    }

    loadDevices()
  }, [])

  // Load staff members
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const response = await fetch(`/api/devices/assign-to-staff`, {
          method: "GET",
        })
        const data = await response.json()
        if (data.staff) {
          setStaff(data.staff)
        }
      } catch (err: any) {
        console.error("[v0] Error loading staff:", err)
      }
    }

    loadStaff()
  }, [])

  const handleAssign = async () => {
    if (!selectedDevice || !selectedStaff) {
      setError("Please select both a device and a staff member")
      return
    }

    setAssigning(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/devices/assign-to-staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: selectedDevice.id,
          staffUserId: selectedStaff.id,
          notes: notes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to assign device")
        toast({
          title: "Assignment Failed",
          description: data.error,
          variant: "destructive",
        })
        return
      }

      setSuccess(
        `Device ${selectedDevice.serial_number} successfully assigned to ${selectedStaff.full_name}`
      )
      toast({
        title: "Success",
        description: `Device assigned to ${selectedStaff.full_name}`,
      })

      // Reset form
      setSelectedDevice(null)
      setSelectedStaff(null)
      setNotes("")

      // Reload devices
      const devicesResponse = await fetch(
        `/api/devices?canSeeAll=true&field=serial`
      )
      const devicesData = await devicesResponse.json()
      if (devicesData.devices) {
        const unassignedDevices = devicesData.devices.filter(
          (d: Device) => !d.assigned_to_user_id
        )
        setDevices(unassignedDevices)
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error("[v0] Error during assignment:", err)
      setError(err.message || "An error occurred")
      toast({
        title: "Error",
        description: err.message || "Failed to assign device",
        variant: "destructive",
      })
    } finally {
      setAssigning(false)
    }
  }

  const filteredDevices = devices.filter((device) =>
    [device.serial_number, device.asset_tag, device.device_type, device.brand, device.model]
      .filter(Boolean)
      .some((field) => field?.toLowerCase().includes(deviceSearch.toLowerCase()))
  )

  const filteredStaff = staff.filter((member) =>
    [member.full_name, member.email, member.department]
      .filter(Boolean)
      .some((field) => field?.toLowerCase().includes(staffSearch.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign IT Device to Staff</CardTitle>
          <CardDescription>
            Directly assign available IT devices to any staff member without requiring approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Device Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Device</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search devices by serial, asset tag, type, brand, or model..."
                  value={deviceSearch}
                  onChange={(e) => setDeviceSearch(e.target.value)}
                />
                <Select
                  value={selectedDevice?.id || ""}
                  onValueChange={(deviceId) => {
                    const device = filteredDevices.find((d) => d.id === deviceId)
                    setSelectedDevice(device || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a device" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDevices.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        No unassigned devices available
                      </div>
                    ) : (
                      filteredDevices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.device_type} - {device.brand} {device.model} (
                          {device.serial_number})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedDevice && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4 space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-gray-600">Serial:</span>{" "}
                      <span>{selectedDevice.serial_number}</span>
                    </div>
                    {selectedDevice.asset_tag && (
                      <div>
                        <span className="font-semibold text-gray-600">Asset Tag:</span>{" "}
                        <span>{selectedDevice.asset_tag}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-gray-600">Type:</span>{" "}
                      <span>{selectedDevice.device_type}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Model:</span>{" "}
                      <span>
                        {selectedDevice.brand} {selectedDevice.model}
                      </span>
                    </div>
                    {selectedDevice.location && (
                      <div>
                        <span className="font-semibold text-gray-600">Location:</span>{" "}
                        <span>{selectedDevice.location}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Staff Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Staff Member</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search staff by name, email, or department..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                />
                <Select
                  value={selectedStaff?.id || ""}
                  onValueChange={(staffId) => {
                    const member = filteredStaff.find((s) => s.id === staffId)
                    setSelectedStaff(member || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStaff.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">
                        No staff members found
                      </div>
                    ) : (
                      filteredStaff.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name} ({member.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedStaff && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4 space-y-2 text-sm">
                    <div>
                      <span className="font-semibold text-gray-600">Name:</span>{" "}
                      <span>{selectedStaff.full_name}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Email:</span>{" "}
                      <span>{selectedStaff.email}</span>
                    </div>
                    {selectedStaff.department && (
                      <div>
                        <span className="font-semibold text-gray-600">Department:</span>{" "}
                        <span>{selectedStaff.department}</span>
                      </div>
                    )}
                    {selectedStaff.location && (
                      <div>
                        <span className="font-semibold text-gray-600">Location:</span>{" "}
                        <span>{selectedStaff.location}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-gray-600">Role:</span>{" "}
                      <span className="capitalize">{selectedStaff.role}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-base font-semibold">
                Assignment Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this device assignment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleAssign}
                disabled={!selectedDevice || !selectedStaff || assigning}
                size="lg"
                className="flex-1"
              >
                {assigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Device"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedDevice(null)
                  setSelectedStaff(null)
                  setNotes("")
                  setError(null)
                  setSuccess(null)
                }}
                disabled={assigning}
                size="lg"
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold">{devices.length}</div>
                <div className="text-sm text-gray-600">Unassigned Devices</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold">{staff.length}</div>
                <div className="text-sm text-gray-600">Staff Members</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
