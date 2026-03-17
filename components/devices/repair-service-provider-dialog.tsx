'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Wrench, Calendar } from 'lucide-react'
import { notificationService } from '@/lib/notification-service'

interface Device {
  id: string
  brand: string
  model: string
  serial_number: string
  device_type: string
}

interface ServiceProvider {
  id: string
  name: string
  email: string
  phone: string
  specialization: string[]
  location: string
  is_active: boolean
}

interface RepairServiceProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: Device | null
  onConfirm: (serviceProviderData: {
    serviceProviderId: string
    issueDescription: string
    priority: string
    estimatedCost: string
  }) => Promise<void>
  loading?: boolean
}

export function RepairServiceProviderDialog({
  open,
  onOpenChange,
  device,
  onConfirm,
  loading = false,
}: RepairServiceProviderDialogProps) {
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [loadingProviders, setLoadingProviders] = useState(true)
  const [error, setError] = useState('')

  // Load service providers on mount
  useEffect(() => {
    if (open && device) {
      loadServiceProviders()
    }
  }, [open, device])

  const loadServiceProviders = async () => {
    try {
      setLoadingProviders(true)
      const response = await fetch('/api/service-providers?is_active=true')
      if (!response.ok) {
        throw new Error('Failed to load service providers')
      }
      const data = await response.json()
      console.log('[v0] Loaded service providers:', data)
      setServiceProviders(data.providers || [])
      setError('')
    } catch (err: any) {
      console.error('[v0] Error loading service providers:', err)
      setError(err.message || 'Failed to load service providers')
      notificationService.error('Error', 'Failed to load service providers')
    } finally {
      setLoadingProviders(false)
    }
  }

  const handleConfirm = async () => {
    if (!selectedProviderId) {
      setError('Please select a service provider')
      notificationService.warning('Validation', 'Please select a service provider')
      return
    }

    if (!issueDescription.trim()) {
      setError('Please describe the issue')
      notificationService.warning('Validation', 'Please describe the issue')
      return
    }

    try {
      await onConfirm({
        serviceProviderId: selectedProviderId,
        issueDescription: issueDescription.trim(),
        priority,
        estimatedCost,
      })
      
      // Reset form after successful submission
      setSelectedProviderId('')
      setIssueDescription('')
      setPriority('medium')
      setEstimatedCost('')
      setError('')
      onOpenChange(false)
    } catch (err: any) {
      console.error('[v0] Error confirming repair:', err)
      setError(err.message || 'Failed to save repair information')
      notificationService.error('Error', err.message || 'Failed to save repair information')
    }
  }

  const selectedProvider = serviceProviders.find(p => p.id === selectedProviderId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            Repair Service Provider
          </DialogTitle>
          <DialogDescription>
            Complete the repair process by assigning a service provider for {device?.brand} {device?.model}
          </DialogDescription>
        </DialogHeader>

        {device && (
          <div className="space-y-4">
            {/* Device Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-blue-900 font-medium">Device Type</p>
                  <p className="text-blue-700">{device.device_type}</p>
                </div>
                <div>
                  <p className="text-blue-900 font-medium">Serial Number</p>
                  <p className="text-blue-700">{device.serial_number}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-blue-900 font-medium">Device</p>
                  <p className="text-blue-700">{device.brand} {device.model}</p>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Service Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider" className="text-sm font-medium">
                Service Provider *
              </Label>
              {loadingProviders ? (
                <div className="text-sm text-muted-foreground py-2">Loading service providers...</div>
              ) : serviceProviders.length === 0 ? (
                <div className="text-sm text-destructive py-2">No active service providers available</div>
              ) : (
                <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select a service provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceProviders.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex flex-col">
                          <span>{provider.name}</span>
                          <span className="text-xs text-muted-foreground">{provider.specialization?.join(', ')}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Service Provider Details */}
            {selectedProvider && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-green-900 font-medium">Email</p>
                    <p className="text-green-700 break-all">{selectedProvider.email}</p>
                  </div>
                  <div>
                    <p className="text-green-900 font-medium">Phone</p>
                    <p className="text-green-700">{selectedProvider.phone}</p>
                  </div>
                  {selectedProvider.location && (
                    <div className="col-span-2">
                      <p className="text-green-900 font-medium">Location</p>
                      <p className="text-green-700">{selectedProvider.location}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Issue Description */}
            <div className="space-y-2">
              <Label htmlFor="issue" className="text-sm font-medium">
                Issue Description *
              </Label>
              <Textarea
                id="issue"
                placeholder="Describe the device issue and what needs to be repaired..."
                value={issueDescription}
                onChange={e => setIssueDescription(e.target.value)}
                className="min-h-24 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Provide detailed information about the device problem to help the service provider
              </p>
            </div>

            {/* Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Estimated Cost */}
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium">
                  Estimated Cost (Optional)
                </Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="0.00"
                  value={estimatedCost}
                  onChange={e => setEstimatedCost(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading || loadingProviders || serviceProviders.length === 0}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {loading ? 'Saving...' : 'Assign Service Provider & Save'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
