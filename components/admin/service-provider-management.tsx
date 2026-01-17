"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreHorizontal, Building, Mail, Phone, MapPin, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { LOCATIONS } from "@/lib/locations"

interface ServiceProvider {
  id: string
  name: string
  email: string
  phone: string
  location: string
  specialization: string[]
  is_active: boolean
  created_at: string
}

const SPECIALIZATIONS = [
  "Laptops",
  "Desktops",
  "Printers",
  "Mobile Devices",
  "Network Equipment",
  "Servers",
  "Tablets",
  "Accessories",
  "Software",
  "Data Recovery",
]

export function ServiceProviderManagement() {
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [addProviderOpen, setAddProviderOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    specialization: [] as string[],
  })

  const supabase = createClient()

  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .order("name")

      if (error) {
        console.error("Error loading service providers:", error)
        return
      }

      setProviders(data || [])
    } catch (err) {
      console.error("Exception loading providers:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProvider = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.location) {
      setError("Please fill in all required fields")
      return
    }

    try {
      setSaving(true)
      setError("")

      const { data, error } = await supabase
        .from("service_providers")
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          specialization: formData.specialization,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        console.error("Error adding provider:", error)
        setError(error.message || "Failed to add provider")
        return
      }

      // Add to local state
      setProviders([...providers, data])
      
      // Reset form and close dialog
      setFormData({
        name: "",
        email: "",
        phone: "",
        location: "",
        specialization: [],
      })
      setAddProviderOpen(false)
    } catch (err) {
      console.error("Exception adding provider:", err)
      setError("An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleProviderAction = async (providerId: string, action: "activate" | "deactivate") => {
    try {
      const newStatus = action === "activate"
      
      const { error } = await supabase
        .from("service_providers")
        .update({ is_active: newStatus })
        .eq("id", providerId)

      if (error) {
        console.error("Error updating provider:", error)
        return
      }

      setProviders(
        providers.map((provider) => {
          if (provider.id === providerId) {
            return { ...provider, is_active: newStatus }
          }
          return provider
        })
      )
    } catch (err) {
      console.error("Exception updating provider:", err)
    }
  }

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm("Are you sure you want to delete this service provider?")) {
      return
    }

    try {
      const { error } = await supabase
        .from("service_providers")
        .delete()
        .eq("id", providerId)

      if (error) {
        console.error("Error deleting provider:", error)
        return
      }

      setProviders(providers.filter((p) => p.id !== providerId))
    } catch (err) {
      console.error("Exception deleting provider:", err)
    }
  }

  const toggleSpecialization = (spec: string) => {
    if (formData.specialization.includes(spec)) {
      setFormData({
        ...formData,
        specialization: formData.specialization.filter((s) => s !== spec),
      })
    } else {
      setFormData({
        ...formData,
        specialization: [...formData.specialization, spec],
      })
    }
  }

  const filteredProviders = providers.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.specialization?.some((specialty) => 
        specialty.toLowerCase().includes(searchTerm.toLowerCase())
      )
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading service providers...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Service Provider Management</h2>
          <p className="text-muted-foreground">Manage repair service providers and contracts</p>
        </div>
        <Dialog open={addProviderOpen} onOpenChange={setAddProviderOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Service Provider</DialogTitle>
              <DialogDescription>Register a new repair service provider</DialogDescription>
            </DialogHeader>
            
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Provider Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., TechFix Ghana Ltd"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@provider.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    placeholder="+233..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => setFormData({ ...formData, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LOCATIONS).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Specializations</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map((spec) => (
                    <Badge
                      key={spec}
                      variant={formData.specialization.includes(spec) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleSpecialization(spec)}
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setAddProviderOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProvider} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Provider"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or specialties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Provider List */}
      <div className="grid gap-4">
        {filteredProviders.map((provider) => (
          <Card key={provider.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3" />
                      <span>{provider.email}</span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={provider.is_active ? "default" : "secondary"}>
                    {provider.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!provider.is_active && (
                        <DropdownMenuItem onClick={() => handleProviderAction(provider.id, "activate")}>
                          Activate Provider
                        </DropdownMenuItem>
                      )}
                      {provider.is_active && (
                        <DropdownMenuItem onClick={() => handleProviderAction(provider.id, "deactivate")}>
                          Deactivate Provider
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDeleteProvider(provider.id)}
                        className="text-destructive"
                      >
                        Delete Provider
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{provider.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium">{provider.location}</p>
                    </div>
                  </div>
                </div>

                {provider.specialization && provider.specialization.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Specialties:</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.specialization.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProviders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No providers found</h3>
            <p className="text-muted-foreground text-center">
              {providers.length === 0 
                ? "No service providers have been added yet. Click 'Add Provider' to create one."
                : "No service providers match your current search criteria."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
