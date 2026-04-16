"use client"

import { useState, useEffect } from "react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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
  const [searchField, setSearchField] = useState<"location" | "type" | "name">("location")
  const [searchQuery, setSearchQuery] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }))
  }

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
      const active = (data.providers || []).filter((p: any) => p.is_active !== false)
      setServiceProviders(active)
    } catch (error) {
      console.error("[v0] Exception fetching service providers:", error)
    }
  }

  const fetchDevices = async (field?: string, q?: string) => {
    try {
      console.log("[v0] Fetching devices for repair form via API...", { field, q })
      const params = new URLSearchParams()
      params.set("canSeeAll", "true")
      if (field && q) {
        if (field === "location") params.set("location", q)
        else {
          params.set("field", field)
          params.set("q", q)
        }
      }
      const response = await fetch(`/api/devices?${params.toString()}`)

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

  useEffect(() => {
    fetchServiceProviders()
    fetchDevices()
  }, [])

  const onSearchClick = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    const q = (searchQuery || "").trim()
    if (!q) {
      await fetchDevices()
      return
    }
    await fetchDevices(searchField, q)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end space-x-2 mb-2">
        <Label className="mr-2">Search Devices</Label>
        <Select value={searchField} onValueChange={(v) => setSearchField(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="location">Location</SelectItem>
            <SelectItem value="type">Type</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Search query" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <Button onClick={(e) => onSearchClick(e)}>Search</Button>
        <Button variant="ghost" onClick={() => { setSearchQuery(""); fetchDevices(); }}>Clear</Button>
      </div>

      <Label htmlFor="serviceProvider">Service Provider</Label>
      <Select value={formData.serviceProvider} onValueChange={(value) => handleInputChange("serviceProvider", value)}>
        <SelectTrigger>
          <SelectValue placeholder="Choose service provider" />
        </SelectTrigger>
        <SelectContent>
              {serviceProviders.length > 0 ? (
                serviceProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
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
