"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Search, Plus, MoreHorizontal, Building, Mail, Phone, MapPin, Loader2, Key, User, Eye, EyeOff, CheckCircle, Copy } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { LOCATIONS } from "@/lib/locations"
import { useToast } from "@/hooks/use-toast"

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
  
  // Credential creation state
  const [createCredentials, setCreateCredentials] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null)
  
  const { toast } = useToast()

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

  // Generate random password
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
    let pwd = ""
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setPassword(pwd)
  }

  // Auto-generate username from provider name
  const generateUsername = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").substring(0, 20) + "_sp"
  }

  const handleAddProvider = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.location) {
      setError("Please fill in all required fields")
      return
    }

    if (createCredentials && (!username || !password)) {
      setError("Please provide username and password for login credentials")
      return
    }

    try {
      setSaving(true)
      setError("")

      let userId: string | null = null

      // First, create user credentials if requested
      if (createCredentials) {
        console.log("[v0] Creating user credentials for service provider...")
        
        const userResponse = await fetch("/api/admin/create-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username,
            password: password,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            role: "service_provider",
            location: formData.location,
            status: "approved",
          }),
        })

        const userResult = await userResponse.json()

        if (!userResponse.ok) {
          console.error("[v0] Error creating user:", userResult.error)
          setError(userResult.error || "Failed to create user credentials")
          return
        }

        console.log("[v0] User created successfully:", userResult.user?.id)
        userId = userResult.user?.id
      }

      // Then create service provider with user_id link
      const { data, error } = await supabase
        .from("service_providers")
        .insert({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          specialization: formData.specialization,
          is_active: true,
          user_id: userId,
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
      
      // Store created credentials to show in confirmation
      if (createCredentials) {
        setCreatedCredentials({ username, password })
        toast({
          title: "Service Provider Created",
          description: `Login credentials have been created. Username: ${username}`,
        })
      }
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        location: "",
        specialization: [],
      })
      setUsername("")
      setPassword("")
      
      // Show credentials dialog instead of closing immediately
      if (!createCredentials) {
        setAddProviderOpen(false)
      }
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

              {/* Login Credentials Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="createCredentials" 
                    checked={createCredentials}
                    onCheckedChange={(checked) => {
                      setCreateCredentials(checked as boolean)
                      if (checked && formData.name && !username) {
                        setUsername(generateUsername(formData.name))
                        if (!password) generatePassword()
                      }
                    }}
                  />
                  <Label htmlFor="createCredentials" className="flex items-center gap-2 cursor-pointer">
                    <Key className="h-4 w-4 text-primary" />
                    Create login credentials for this provider
                  </Label>
                </div>

                {createCredentials && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      This will allow the service provider to log in and view their assigned repair tasks.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username *</Label>
                        <div className="flex gap-2">
                          <Input
                            id="username"
                            placeholder="e.g., techfix_sp"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => formData.name && setUsername(generateUsername(formData.name))}
                            title="Auto-generate from name"
                          >
                            <User className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={generatePassword}
                            title="Generate random password"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Created Credentials Display */}
              {createdCredentials && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h4 className="font-medium text-green-800 dark:text-green-200">Credentials Created Successfully</h4>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                    Please save these credentials securely. The password cannot be retrieved later.
                  </p>
                  <div className="grid grid-cols-2 gap-4 bg-white dark:bg-gray-900 rounded p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Username</p>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm">{createdCredentials.username}</code>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(createdCredentials.username)
                            toast({ title: "Copied", description: "Username copied to clipboard" })
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Password</p>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm">{createdCredentials.password}</code>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(createdCredentials.password)
                            toast({ title: "Copied", description: "Password copied to clipboard" })
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="mt-4 w-full" 
                    onClick={() => {
                      setCreatedCredentials(null)
                      setAddProviderOpen(false)
                    }}
                  >
                    Done
                  </Button>
                </div>
              )}
              
              {!createdCredentials && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setAddProviderOpen(false)
                    setCreatedCredentials(null)
                    setUsername("")
                    setPassword("")
                  }}>
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
              )}
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
