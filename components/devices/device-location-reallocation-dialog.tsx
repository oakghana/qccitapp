'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, MapPin, CheckCircle2 } from 'lucide-react'
import { notificationService } from '@/lib/notification-service'
import type { DeviceWithoutLocation } from '@/lib/device-location-service'

interface DeviceLocationReallocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  devices: DeviceWithoutLocation[]
  onReallocate: () => void
}

export function DeviceLocationReallocationDialog({
  open,
  onOpenChange,
  devices,
  onReallocate,
}: DeviceLocationReallocationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [locations, setLocations] = useState<Array<{ code: string; name: string }>>([])
  const [step, setStep] = useState<'select' | 'confirm'>('select')
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      // Select all devices by default
      setSelectedDeviceIds(new Set(devices.map(d => d.id)))
      fetchLocations()
    }
  }, [open, devices])

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/admin/lookup-data?type=locations')
      if (res.ok) {
        const data = await res.json()
        const active = data.filter((l: any) => l.is_active).map((l: any) => ({
          code: l.code,
          name: l.name,
        }))
        setLocations(active)
      }
    } catch (error) {
      console.error('[v0] Error fetching locations:', error)
      notificationService.error(
        'Failed to load locations',
        'Please try again'
      )
    }
  }

  const handleSelectDevice = (deviceId: string, selected: boolean) => {
    const newSelection = new Set(selectedDeviceIds)
    if (selected) {
      newSelection.add(deviceId)
    } else {
      newSelection.delete(deviceId)
    }
    setSelectedDeviceIds(newSelection)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedDeviceIds(new Set(devices.map(d => d.id)))
    } else {
      setSelectedDeviceIds(new Set())
    }
  }

  const handleReallocate = async () => {
    if (!selectedLocation) {
      notificationService.warning(
        'Please select a location',
        'Choose a location to reallocate devices'
      )
      return
    }

    if (selectedDeviceIds.size === 0) {
      notificationService.warning(
        'Please select devices',
        'Choose at least one device to reallocate'
      )
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/devices/reallocate-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceIds: Array.from(selectedDeviceIds),
          newLocation: selectedLocation,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to reallocate devices')
      }

      const result = await response.json()

      notificationService.success(
        'Devices Reallocated',
        `Successfully reallocated ${result.reallocated} device(s) to ${selectedLocation}`
      )

      // Reset form
      setStep('select')
      setSelectedLocation('')
      setSelectedDeviceIds(new Set())
      onOpenChange(false)
      onReallocate()
    } catch (error: any) {
      console.error('[v0] Error reallocating devices:', error)
      notificationService.error(
        'Reallocation Failed',
        error.message || 'Failed to reallocate devices'
      )
    } finally {
      setLoading(false)
    }
  }

  const selectedLocationName = locations.find(
    l => l.code === selectedLocation
  )?.name

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Reallocate Devices to New Location
          </DialogTitle>
          <DialogDescription>
            {devices.length} device(s) currently without a location
          </DialogDescription>
        </DialogHeader>

        {step === 'select' ? (
          <div className="space-y-4">
            {/* Device Selection */}
            <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b">
                <Label className="font-semibold">Select Devices</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectAll(selectedDeviceIds.size < devices.length)}
                >
                  {selectedDeviceIds.size < devices.length ? 'Select All' : 'Deselect All'}
                </Button>
              </div>

              {devices.map(device => (
                <div key={device.id} className="flex items-start gap-3 p-2 hover:bg-muted rounded">
                  <input
                    type="checkbox"
                    id={`device-${device.id}`}
                    checked={selectedDeviceIds.has(device.id)}
                    onChange={e => handleSelectDevice(device.id, e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border"
                  />
                  <label
                    htmlFor={`device-${device.id}`}
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <div className="font-medium text-sm">
                      {device.brand} {device.model}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      SN: {device.serial_number} • {device.device_type}
                    </div>
                  </label>
                </div>
              ))}
            </div>

            {/* Location Selection */}
            <div className="space-y-2">
              <Label htmlFor="location">New Location *</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a new location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.code} value={loc.code}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <strong>Note:</strong> All selected devices will be moved to the same location.
                You can reallocate them individually later if needed.
              </div>
            </div>
          </div>
        ) : (
          /* Confirmation Step */
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">Ready to Reallocate</h4>
                  <p className="text-sm text-green-800 mt-1">
                    {selectedDeviceIds.size} device(s) will be moved to:
                  </p>
                </div>
              </div>

              <div className="bg-white rounded p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">New Location:</span>
                  <span className="font-semibold">{selectedLocationName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Devices Selected:</span>
                  <span className="font-semibold">{selectedDeviceIds.size}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Selected devices:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {devices
                      .filter(d => selectedDeviceIds.has(d.id))
                      .map(device => (
                        <div key={device.id} className="text-xs text-muted-foreground">
                          • {device.brand} {device.model} (SN: {device.serial_number})
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (step === 'confirm') {
                setStep('select')
              } else {
                onOpenChange(false)
              }
            }}
            disabled={loading}
          >
            {step === 'confirm' ? 'Back' : 'Cancel'}
          </Button>

          {step === 'select' ? (
            <Button
              onClick={() => setStep('confirm')}
              disabled={!selectedLocation || selectedDeviceIds.size === 0}
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleReallocate} disabled={loading}>
              {loading ? 'Reallocating...' : 'Confirm Reallocation'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
