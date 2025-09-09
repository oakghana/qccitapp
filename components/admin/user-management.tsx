"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreHorizontal, User, MapPin, Mail, Phone } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface SystemUser {
  id: string
  name: string
  email: string
  phone: string
  role: "admin" | "it_head" | "it_staff" | "user"
  location: "head_office" | "accra" | "kumasi" | "kaase_inland_port" | "cape_coast"
  status: "active" | "inactive" | "suspended"
  lastLogin: string
  createdDate: string
  deviceCount: number
}

const mockUsers: SystemUser[] = [
  {
    id: "USR-001",
    name: "John Doe",
    email: "john.doe@company.com",
    phone: "+233241234567",
    role: "admin",
    location: "head_office",
    status: "active",
    lastLogin: "2024-03-02T10:30:00Z",
    createdDate: "2024-01-15",
    deviceCount: 2,
  },
  {
    id: "USR-002",
    name: "Kwame Asante",
    email: "kwame.asante@company.com",
    phone: "+233241234568",
    role: "user",
    location: "accra",
    status: "active",
    lastLogin: "2024-03-01T14:20:00Z",
    createdDate: "2024-01-20",
    deviceCount: 1,
  },
  {
    id: "USR-003",
    name: "Ama Osei",
    email: "ama.osei@company.com",
    phone: "+233241234569",
    role: "it_head",
    location: "kumasi",
    status: "active",
    lastLogin: "2024-03-02T09:15:00Z",
    createdDate: "2024-01-18",
    deviceCount: 3,
  },
  {
    id: "USR-004",
    name: "Kofi Mensah",
    email: "kofi.mensah@company.com",
    phone: "+233241234570",
    role: "it_staff",
    location: "kaase_inland_port",
    status: "inactive",
    lastLogin: "2024-02-28T16:45:00Z",
    createdDate: "2024-02-01",
    deviceCount: 1,
  },
]

const roleColors = {
  admin: "destructive",
  it_head: "default",
  it_staff: "secondary",
  user: "outline",
} as const

const statusColors = {
  active: "default",
  inactive: "secondary",
  suspended: "destructive",
} as const

const locationNames = {
  head_office: "Head Office",
  accra: "Accra",
  kumasi: "Kumasi",
  kaase_inland_port: "Kaase Inland Port",
  cape_coast: "Cape Coast",
}

export function UserManagement() {
  const { user } = useAuth()
  const [users, setUsers] = useState<SystemUser[]>(mockUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [addUserOpen, setAddUserOpen] = useState(false)

  const getFilteredUsers = () => {
    let filteredByAccess = users

    if (user?.role === "it_head" && user?.location !== "head_office") {
      filteredByAccess = users.filter((u) => u.location === user.location)
    }

    return filteredByAccess.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesLocation = locationFilter === "all" || user.location === locationFilter

      return matchesSearch && matchesRole && matchesLocation
    })
  }

  const filteredUsers = getFilteredUsers()

  const getLocationFilterOptions = () => {
    if (user?.role === "it_head" && user?.location !== "head_office") {
      return [
        { value: "all", label: "All Locations" },
        { value: user.location, label: locationNames[user.location as keyof typeof locationNames] },
      ]
    }

    return [
      { value: "all", label: "All Locations" },
      { value: "head_office", label: "Head Office" },
      { value: "accra", label: "Accra" },
      { value: "kumasi", label: "Kumasi" },
      { value: "kaase_inland_port", label: "Kaase Inland Port" },
      { value: "cape_coast", label: "Cape Coast" },
    ]
  }

  const locationOptions = getLocationFilterOptions()

  const handleUserAction = (userId: string, action: "activate" | "deactivate" | "suspend" | "delete") => {
    setUsers(
      users.map((user) => {
        if (user.id === userId) {
          switch (action) {
            case "activate":
              return { ...user, status: "active" as const }
            case "deactivate":
              return { ...user, status: "inactive" as const }
            case "suspend":
              return { ...user, status: "suspended" as const }
            default:
              return user
          }
        }
        return user
      }),
    )

    if (action === "delete") {
      setUsers(users.filter((user) => user.id !== userId))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">
            {user?.role === "it_head" && user?.location !== "head_office"
              ? `Manage users in ${locationNames[user.location as keyof typeof locationNames]}`
              : "Manage system users and access permissions"}
          </p>
        </div>
        <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new system user account</DialogDescription>
            </DialogHeader>
            <AddUserForm
              onClose={() => setAddUserOpen(false)}
              onUserAdded={(newUser) => {
                setUsers([...users, newUser])
                setAddUserOpen(false)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="it_head">IT Head</SelectItem>
                <SelectItem value="it_staff">IT Staff</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                {locationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>{user.id}</span>
                      <span>•</span>
                      <Mail className="h-3 w-3" />
                      <span>{user.email}</span>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={roleColors[user.role]}>
                    {user.role.replace("_", " ").charAt(0).toUpperCase() + user.role.replace("_", " ").slice(1)}
                  </Badge>
                  <Badge variant={statusColors[user.status]}>
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.status !== "active" && (
                        <DropdownMenuItem onClick={() => handleUserAction(user.id, "activate")}>
                          Activate User
                        </DropdownMenuItem>
                      )}
                      {user.status === "active" && (
                        <DropdownMenuItem onClick={() => handleUserAction(user.id, "deactivate")}>
                          Deactivate User
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleUserAction(user.id, "suspend")}>
                        Suspend User
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleUserAction(user.id, "delete")}
                        className="text-destructive"
                      >
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{locationNames[user.location]}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Devices</p>
                  <p className="font-medium">{user.deviceCount} assigned</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Login</p>
                  <p className="font-medium">{new Date(user.lastLogin).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
            <p className="text-muted-foreground text-center">
              No users match your current filters. Try adjusting your search criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AddUserForm({ onClose, onUserAdded }: { onClose: () => void; onUserAdded: (user: SystemUser) => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user" as SystemUser["role"],
    location: "head_office" as SystemUser["location"],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newUser: SystemUser = {
      id: `USR-${String(Date.now()).slice(-3).padStart(3, "0")}`,
      ...formData,
      status: "active",
      lastLogin: new Date().toISOString(),
      createdDate: new Date().toISOString().split("T")[0],
      deviceCount: 0,
    }

    onUserAdded(newUser)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Role</label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value as SystemUser["role"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="it_staff">IT Staff</SelectItem>
              <SelectItem value="it_head">IT Head</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <label className="text-sm font-medium">Location</label>
          <Select
            value={formData.location}
            onValueChange={(value) => setFormData({ ...formData, location: value as SystemUser["location"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="head_office">Head Office</SelectItem>
              <SelectItem value="accra">Accra</SelectItem>
              <SelectItem value="kumasi">Kumasi</SelectItem>
              <SelectItem value="kaase_inland_port">Kaase Inland Port</SelectItem>
              <SelectItem value="cape_coast">Cape Coast</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Create User</Button>
      </div>
    </form>
  )
}
