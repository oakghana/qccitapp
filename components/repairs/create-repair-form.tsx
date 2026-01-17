"use client"

import { useState, useEffect } from "react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
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
  const supabase = createClient()
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
        console.log("[v0] Fetching service providers for repair form...")
        const { data, error } = await supabase
          .from("service_providers")
          .select("id, name")
          .eq("is_active", true)
          .order("name")

        if (error) {
          console.error("[v0] Error fetching service providers:", error)
          console.error("[v0] Error details:", JSON.stringify(error))
          throw error
        }

        console.log("[v0] Loaded service providers for repair form:", data)
        console.log("[v0] Provider count:", data?.length || 0)
        setServiceProviders(data || [])
      } catch (error) {
        console.error("[v0] Exception fetching service providers:", error)
      }
    }

    const fetchDevices = async () => {
      try {
        const { data, error } = await supabase.from("devices").select("*")

        if (error) throw error
        console.log("[v0] Loaded devices:", data)
        setDevices(data || [])
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
