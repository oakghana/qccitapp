"use client"

import { useState, useEffect } from "react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface Device {
  id: string
  type: string
  brand: string
  model: string
  serial_number: string
  asset_tag: string
  location: string
  status: string
}

interface CreateRepairFormProps {
  onSubmit: (formData: any) => void
  onCancel: () => void
}

export function CreateRepairForm({ onSubmit, onCancel }: CreateRepairFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [serviceProviders, setServiceProviders] = useState<{ id: string; name: string }[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [formData, setFormData] = useState({ serviceProvider: "" })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }))
  }

  useEffect(() => {
    const fetchServiceProviders = async () => {
      try {
        console.log("[v0] Fetching service providers for repair form via API...")
        const response = await fetch("/api/admin/service-providers?activeOnly=true")
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error("[v0] Error fetching service providers:", errorData.error)
          return
        }

        const data = await response.json()
        console.log("[v0] Loaded service providers for repair form:", data.providers?.length || 0)
        setServiceProviders(data.providers || [])
      } catch (error) {
        console.error("[v0] Exception fetching service providers:", error)
      }
    }

    const fetchDevices = async () => {
      try {
        console.log("[v0] Fetching devices for repair form via API...")
        const response = await fetch("/api/devices?canSeeAll=true")
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error("[v0] Error fetching devices:", errorData.error)
          return
        }

        const data = await response.json()
        console.log("[v0] Loaded devices:", data.devices?.length || 0)
        setDevices(data.devices || [])
      } catch (error) {
        console.error("[v0] Error fetching devices:", error)
      }
    }

    fetchServiceProviders()
    fetchDevices()
  }, [])

  return (
    <div className="space-y-2">
      <Label htmlFor="serviceProvider">Service Provider</Label>
      <Select value={formData.serviceProvider} onValueChange={(value) => handleInputChange("serviceProvider", value)}>
        <SelectTrigger>
          <SelectValue placeholder="Choose service provider" />
        </SelectTrigger>
        <SelectContent>
          {serviceProviders.length > 0 ? (
            serviceProviders.map((provider) => (
              <SelectItem key={provider.id} value={provider.name}>
                {provider.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="loading" disabled>
              Loading providers...
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
