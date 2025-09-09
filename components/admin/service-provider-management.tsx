"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreHorizontal, Building, Mail, Phone, MapPin, Star } from "lucide-react"

interface ServiceProvider {
  id: string
  name: string
  email: string
  phone: string
  address: string
  specialties: string[]
  status: "active" | "inactive" | "suspended"
  rating: number
  completedRepairs: number
  avgRepairTime: number
  onTimeDelivery: number
  contractStart: string
  lastService: string
}

const mockProviders: ServiceProvider[] = [
  {
    id: "SP-001",
    name: "Natland Computers",
    email: "support@natlandcomputers.com.gh",
    phone: "+233302555000",
    address: "15 Liberation Road, Accra & 45 Prempeh II Street, Kumasi",
    specialties: ["Laptops", "Desktops", "Printers", "Mobile Devices", "Network Equipment"],
    status: "active",
    rating: 4.8,
    completedRepairs: 156,
    avgRepairTime: 5.2,
    onTimeDelivery: 94,
    contractStart: "2024-01-01",
    lastService: "2024-03-02",
  },
  {
    id: "SP-002",
    name: "TechFix Ghana Ltd",
    email: "contact@techfix.com.gh",
    phone: "+233302123456",
    address: "123 Liberation Road, Accra",
    specialties: ["Laptops", "Desktops", "Printers"],
    status: "active",
    rating: 4.2,
    completedRepairs: 45,
    avgRepairTime: 7.5,
    onTimeDelivery: 85,
    contractStart: "2024-01-01",
    lastService: "2024-03-01",
  },
  {
    id: "SP-003",
    name: "CompuServe Solutions",
    email: "info@compuserve.gh",
    phone: "+233322654321",
    address: "456 Ring Road, Kumasi",
    specialties: ["Mobile Devices", "Tablets", "Accessories"],
    status: "active",
    rating: 4.7,
    completedRepairs: 32,
    avgRepairTime: 6.2,
    onTimeDelivery: 92,
    contractStart: "2024-01-15",
    lastService: "2024-02-28",
  },
]

const statusColors = {
  active: "default",
  inactive: "secondary",
  suspended: "destructive",
} as const

export function ServiceProviderManagement() {
  const [providers, setProviders] = useState<ServiceProvider[]>(mockProviders)
  const [searchTerm, setSearchTerm] = useState("")
  const [addProviderOpen, setAddProviderOpen] = useState(false)

  const filteredProviders = providers.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.specialties.some((specialty) => specialty.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handleProviderAction = (providerId: string, action: "activate" | "deactivate" | "suspend") => {
    setProviders(
      providers.map((provider) => {
        if (provider.id === providerId) {
          switch (action) {
            case "activate":
              return { ...provider, status: "active" as const }
            case "deactivate":
              return { ...provider, status: "inactive" as const }
            case "suspend":
              return { ...provider, status: "suspended" as const }
            default:
              return provider
          }
        }
        return provider
      }),
    )
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600"
    if (rating >= 4.0) return "text-blue-600"
    if (rating >= 3.5) return "text-yellow-600"
    return "text-red-600"
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
            <div className="p-4 text-center text-muted-foreground">
              Provider registration form would be implemented here
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
                      <span>{provider.id}</span>
                      <span>•</span>
                      <Mail className="h-3 w-3" />
                      <span>{provider.email}</span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Star className={`h-4 w-4 ${getRatingColor(provider.rating)}`} />
                    <span className={`text-sm font-medium ${getRatingColor(provider.rating)}`}>{provider.rating}</span>
                  </div>
                  <Badge variant={statusColors[provider.status]}>
                    {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {provider.status !== "active" && (
                        <DropdownMenuItem onClick={() => handleProviderAction(provider.id, "activate")}>
                          Activate Provider
                        </DropdownMenuItem>
                      )}
                      {provider.status === "active" && (
                        <DropdownMenuItem onClick={() => handleProviderAction(provider.id, "deactivate")}>
                          Deactivate Provider
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleProviderAction(provider.id, "suspend")}>
                        Suspend Provider
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
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium">{provider.address}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Specialties:</p>
                  <div className="flex flex-wrap gap-1">
                    {provider.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Completed Repairs</p>
                    <p className="font-medium text-lg">{provider.completedRepairs}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Repair Time</p>
                    <p className="font-medium text-lg">{provider.avgRepairTime}d</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">On-Time Delivery</p>
                    <p className="font-medium text-lg">{provider.onTimeDelivery}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Service</p>
                    <p className="font-medium">{new Date(provider.lastService).toLocaleDateString()}</p>
                  </div>
                </div>
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
              No service providers match your current search criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
