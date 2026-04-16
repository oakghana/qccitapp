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
import { AlertCircle, Barcode, Plus, X } from 'lucide-react'
import { notificationService } from '@/lib/notification-service'
import { deviceLocationService } from '@/lib/device-location-service'

interface DeviceQuickEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeviceAdded?: () => void
}

interface QuickDevice {
  serialNumber: string
  assetTag: string
  brand: string
  model: string
  deviceType: string
}

export function DeviceQuickEntryDialog({
  open,
  onOpenChange,
  onDeviceAdded,
}: DeviceQuickEntryDialogProps) {
  const [loading, setLoading] = useState(false)
  const [deviceTypes, setDeviceTypes] = useState<Array<{ code: string; name: string }>>([])
  const [devices, setDevices] = useState<QuickDevice[]>([
    { serialNumber: '', assetTag: '', brand: '', model: '', deviceType: 'laptop' },
  ])
  const [userLocation, setUserLocation] = useState<string>('')
  const [duplicateWarnings, setDuplicateWarnings] = useState<Record<number, string>>({})

  useEffect(() => {
    if (open) {
      fetchDeviceTypes()
      fetchUserLocation()
    }
  }, [open])

  const fetchDeviceTypes = async () => {
    try {
      const res = await fetch('/api/admin/lookup-data?type=device_types')
      if (res.ok) {
        const data = await res.json()
        const active = data.filter((t: any) => t.is_active)
        setDeviceTypes(active)
      }
    } catch (error) {
      console.error('[v0] Error fetching device types:', error)
    }
  }

  const fetchUserLocation = async () => {
    try {
      // Get current user's location from auth context or session
      const res = await fetch('/api/auth/session')
      if (res.ok) {
        const data = await res.json()
        if (data.user?.location) {
          setUserLocation(data.user.location)
        }
      }
    } catch (error) {
      console.error('[v0] Error fetching user location:', error)
    }
  }

  const addDeviceField = () => {
    setDevices([
      ...devices,
      { serialNumber: '', assetTag: '', brand: '', model: '', deviceType: 'laptop' },
    ])
  }

  const removeDeviceField = (index: number) => {
    setDevices(devices.filter((_, i) => i !== index))
    const newWarnings = { ...duplicateWarnings }
    delete newWarnings[index]
    setDuplicateWarnings(newWarnings)
  }

  const updateDevice = (index: number, field: keyof QuickDevice, value: string) => {
    const updated = [...devices]
    updated[index] = { ...updated[index], [field]: value }
    setDevices(updated)

    // Clear duplicate warning when user changes serial number
    if (field === 'serialNumber') {
      const newWarnings = { ...duplicateWarnings }
      delete newWarnings[index]
      setDuplicateWarnings(newWarnings)
    }
  }

  const checkDuplicates = async () => {
    const warnings: Record<number, string> = {}

    for (let i = 0; i < devices.length; i++) {
      const device = devices[i]
      if (!device.serialNumber || !device.brand || !device.model) continue

      const duplicate = await deviceLocationService.checkDuplicateLocation(
        device.serialNumber,
        userLocation
      )
      if (duplicate) {
        warnings[i] = `Already exists: ${duplicate.brand} ${duplicate.model}`
      }
    }

    setDuplicateWarnings(warnings)
    return Object.keys(warnings).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate at least one device
    const validDevices = devices.filter(
      d => d.serialNumber && d.brand && d.model && d.deviceType
    )

    if (validDevices.length === 0) {
      notificationService.warning(
        'No devices to add',
        'Please enter at least one device with serial number, brand, and model'
      )
      return
    }

    // Check for duplicates
    const noDuplicates = await checkDuplicates()
    if (!noDuplicates) {
      notificationService.warning(
        'Duplicate devices detected',
        'Some devices already exist at this location. Please review.'
      )
      return
    }

    setLoading(true)
    try {
      let successCount = 0
      let errorCount = 0

      for (const device of validDevices) {
        try {
          const response = await fetch('/api/devices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_type: device.deviceType,
              brand: device.brand,
              model: device.model,
              serial_number: device.serialNumber,
              asset_tag: device.assetTag || null,
              location: userLocation,
              status: 'active',
            }),
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          console.error('[v0] Error adding device:', error)
          errorCount++
        }
      }

      if (successCount > 0) {
        notificationService.success(
          'Devices Added',
          `Successfully added ${successCount} device(s)`
        )
        setDevices([{ serialNumber: '', assetTag: '', brand: '', model: '', deviceType: 'laptop' }])
        setDuplicateWarnings({})
        onOpenChange(false)
        onDeviceAdded?.()
      }

      if (errorCount > 0) {
        notificationService.warning(
          'Partial Success',
          `${successCount} added successfully, ${errorCount} failed`
        )
      }
    } catch (error: any) {
      console.error('[v0] Error adding devices:', error)
      notificationService.error(
        'Failed to add devices',
        error.message || 'Please try again'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="w-5 h-5" />
            Quick Device Entry
          </DialogTitle>
          <DialogDescription>
            Add multiple devices quickly. Scan barcodes or enter details manually.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Location Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <strong>Location:</strong> All devices will be added to <strong>{userLocation || 'Not assigned'}</strong>
            </div>
          </div>

          {/* Device Entries */}
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {devices.map((device, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <Label className="font-semibold">Device {index + 1}</Label>
                  {devices.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDeviceField(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {duplicateWarnings[index] && (
                  <div className="bg-amber-50 border border-amber-200 rounded p-2 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-amber-800">{duplicateWarnings[index]}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`serial-${index}`} className="text-xs">
                      Serial Number *
                    </Label>
                    <Input
                      id={`serial-${index}`}
                      placeholder="Scan or enter"
                      value={device.serialNumber}
                      onChange={e => updateDevice(index, 'serialNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`asset-${index}`} className="text-xs">
                      Asset Tag
                    </Label>
                    <Input
                      id={`asset-${index}`}
                      placeholder="QCC-IT-001"
                      value={device.assetTag}
                      onChange={e => updateDevice(index, 'assetTag', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`brand-${index}`} className="text-xs">
                      Brand *
                    </Label>
                    <Input
                      id={`brand-${index}`}
                      placeholder="Dell, HP, etc."
                      value={device.brand}
                      onChange={e => updateDevice(index, 'brand', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`model-${index}`} className="text-xs">
                      Model *
                    </Label>
                    <Input
                      id={`model-${index}`}
                      placeholder="Model number"
                      value={device.model}
                      onChange={e => updateDevice(index, 'model', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`type-${index}`} className="text-xs">
                      Type *
                    </Label>
                    <Select value={device.deviceType} onValueChange={value => updateDevice(index, 'deviceType', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceTypes.map(type => (
                          <SelectItem key={type.code} value={type.code}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Device Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={addDeviceField}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Device
          </Button>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : `Add ${devices.filter(d => d.serialNumber).length} Device(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
