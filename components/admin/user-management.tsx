"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import {
  Search,
  Plus,
  MoreHorizontal,
  User,
  MapPin,
  Mail,
  Phone,
  Smartphone,
  Download,
  KeyRound,
  Pencil,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { FormNavigation } from "@/components/ui/form-navigation"
import { usePWAInstall } from "@/components/ui/pwa-install"
import { getRoleColorScheme } from "@/lib/role-colors"
import { cn } from "@/lib/utils"
import { createClient } from "@/supabase/supabase-client"
import { getLocationOptions, LOCATIONS } from "@/lib/locations"

interface SystemUser {
  id: string
  name: string
  email: string
  phone: string
  role:
    | "admin"
    | "regional_it_head"
    | "it_head"
    | "it_staff"
    | "staff"
    | "it_store_head"
    | "service_desk_accra"
    | "service_desk_kumasi"
    | "service_desk_tema"
    | "service_desk_takoradi"
    | "service_desk_cape_coast"
    | "service_desk_ho"
  location: string
  status: "active" | "inactive" | "suspended"
  lastLogin: string
  createdDate: string
  deviceCount: number
}

const roleBadgeColors = {
  admin: "destructive",
  regional_it_head: "default",
  it_head: "default",
  it_staff: "secondary",
  staff: "outline",
  it_store_head: "secondary",
  service_desk_accra: "outline",
  service_desk_kumasi: "outline",
  service_desk_tema: "outline",
  service_desk_takoradi: "outline",
  service_desk_cape_coast: "outline",
  service_desk_ho: "outline",
} as const

const statusColors = {
  active: "default",
  inactive: "secondary",
  suspended: "destructive",
} as const

const locationNames = LOCATIONS

const canSeeAllLocations = (user: any) => {
  return user.role === "admin" || user.location === "Head Office"
}

export function UserManagement() {
  const { user } = useAuth()
  const { isInstalled, isInstallable } = usePWAInstall()
  const [users, setUsers] = useState<SystemUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const roleColors = user?.role ? getRoleColorScheme(user.role) : null
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [selectedUserForReset, setSelectedUserForReset] = useState<SystemUser | null>(null)
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<SystemUser | null>(null)
  const [loading, setLoading] = useState(true)

  const handleInstallPWA = () => {
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the A2HS prompt")
      } else {
        console.log("User dismissed the A2HS prompt")
      }
      setDeferredPrompt(null)
    })
  }

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true)
        console.log("[v0] Loading users from Supabase...")

        const supabase = createClient()
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("status", "approved")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[v0] Error loading users:", error)
          return
        }

        console.log("[v0] Loaded users from Supabase:", data)

        const mappedUsers: SystemUser[] = data.map((profile: any) => ({
          id: profile.id,
          name: profile.full_name || profile.username,
          email: profile.email || profile.username,
          phone: profile.phone || "",
          role: profile.role,
          location: profile.location || "Head Office",
          status: profile.status === "approved" ? "active" : "inactive",
          lastLogin: profile.updated_at,
          createdDate: new Date(profile.created_at).toISOString().split("T")[0],
          deviceCount: 0,
        }))

        setUsers(mappedUsers)
      } catch (error) {
        console.error("[v0] Error loading users:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const getFilteredUsers = () => {
    let filteredByAccess = users

    if (user && !canSeeAllLocations(user) && user?.location) {
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
    const allOptions = getLocationOptions()

    if (user?.role === "it_head" && user?.location !== "Head Office") {
      return [
        { value: "all", label: "All Locations" },
        { value: user.location, label: user.location },
      ]
    }

    return [{ value: "all", label: "All Locations" }, ...allOptions]
  }

  const locationOptions = getLocationFilterOptions()

  const handleUserAction = async (userId: string, action: "activate" | "deactivate" | "suspend" | "delete") => {
    try {
      const supabase = createClient()

      if (action === "delete") {
        // Delete user from database
        const { error } = await supabase.from("profiles").delete().eq("id", userId)

        if (error) {
          console.error("[v0] Error deleting user:", error)
          alert("Failed to delete user. Please try again.")
          return
        }

        // Remove from UI
        setUsers(users.filter((user) => user.id !== userId))
      } else {
        // Update user status
        const newStatus = action === "activate" ? "approved" : action === "deactivate" ? "pending" : "suspended"
        const isActive = action === "activate"

        const { error } = await supabase
          .from("profiles")
          .update({
            status: newStatus,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)

        if (error) {
          console.error("[v0] Error updating user status:", error)
          alert("Failed to update user status. Please try again.")
          return
        }

        // Update UI
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
      }
    } catch (error) {
      console.error("[v0] Error in handleUserAction:", error)
      alert("An error occurred. Please try again.")
    }
  }

  const handleResetPassword = (user: SystemUser) => {
    setSelectedUserForReset(user)
    setResetPasswordOpen(true)
  }

  const handleEditUser = (user: SystemUser) => {
    setSelectedUserForEdit(user)
    setEditUserOpen(true)
  }

  return (
    <div className="space-y-6">
      <FormNavigation currentPage="/dashboard/users" />

      {!isInstalled && isInstallable && deferredPrompt && (
        <Card
          className={cn(
            "border-primary/20",
            roleColors
              ? `${roleColors.background}`
              : "bg-gradient-to-br from-orange-50 to-amber-50 dark:bg-gradient-to-br dark:from-orange-950 dark:to-amber-950",
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    roleColors ? `${roleColors.background}` : "bg-orange-100 dark:bg-orange-800",
                  )}
                >
                  <Smartphone
                    className={cn(
                      "h-5 w-5",
                      roleColors ? roleColors.textSecondary : "text-orange-600 dark:text-orange-400",
                    )}
                  />
                </div>
                <div>
                  <h3
                    className={cn(
                      "font-semibold",
                      roleColors ? roleColors.textPrimary : "text-orange-900 dark:text-orange-100",
                    )}
                  >
                    Install Mobile App
                  </h3>
                  <p
                    className={cn(
                      "text-sm",
                      roleColors ? roleColors.textSecondary : "text-orange-700 dark:text-orange-300",
                    )}
                  >
                    Install QCC IT Tracker as a mobile app for quick access and offline functionality
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 text-xs"
                >
                  PWA
                </Badge>
              </div>
              <Button
                onClick={handleInstallPWA}
                size="sm"
                className={cn(
                  "text-white",
                  roleColors
                    ? `bg-gradient-to-r ${roleColors.gradient} ${roleColors.hoverGradient}`
                    : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600",
                )}
              >
                <Download className="mr-2 h-4 w-4" />
                Install
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">
            {user?.role === "it_head" && user?.location !== "Head Office"
              ? `Manage users in ${user.location}`
              : "Manage system users and access permissions"}
          </p>
        </div>

        <div className="flex gap-2">
          {user?.role === "admin" && (
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard/user-accounts")}
              className="hover:bg-blue-50 hover:border-blue-300"
            >
              <User className="mr-2 h-4 w-4" />
              Account Requests
              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                3
              </Badge>
            </Button>
          )}

          <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white">
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
      </div>

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
                <SelectItem value="regional_it_head">Regional IT Head</SelectItem>
                <SelectItem value="it_head">IT Head</SelectItem>
                <SelectItem value="it_staff">IT Staff</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="it_store_head">IT Store Head</SelectItem>
                <SelectItem value="service_desk_accra">Service Desk (Accra)</SelectItem>
                <SelectItem value="service_desk_kumasi">Service Desk (Kumasi)</SelectItem>
                <SelectItem value="service_desk_tema">Service Desk (Tema)</SelectItem>
                <SelectItem value="service_desk_takoradi">Service Desk (Takoradi)</SelectItem>
                <SelectItem value="service_desk_cape_coast">Service Desk (Cape Coast)</SelectItem>
                <SelectItem value="service_desk_ho">Service Desk (Ho)</SelectItem>
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

      {loading ? (
        <div className="flex justify-center items-center">
          <p>Loading users...</p>
        </div>
      ) : (
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
                    <Badge variant={roleBadgeColors[user.role]}>
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
                        <DropdownMenuItem
                          onClick={() => handleEditUser(user)}
                          className="hover:bg-purple-50 hover:text-purple-700 cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleResetPassword(user)}
                          className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        {user.status !== "active" && (
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user.id, "activate")}
                            className="hover:bg-green-50 hover:text-green-700 cursor-pointer"
                          >
                            Activate User
                          </DropdownMenuItem>
                        )}
                        {user.status === "active" && (
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user.id, "deactivate")}
                            className="hover:bg-yellow-50 hover:text-yellow-700 cursor-pointer"
                          >
                            Deactivate User
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleUserAction(user.id, "suspend")}
                          className="hover:bg-orange-50 hover:text-orange-700 cursor-pointer"
                        >
                          Suspend User
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (
                              confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)
                            ) {
                              handleUserAction(user.id, "delete")
                            }
                          }}
                          className="text-destructive hover:bg-red-50 hover:text-red-700 cursor-pointer"
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
                      <p className="font-medium">{user.location}</p>
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
      )}

      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>Set a new password for {selectedUserForReset?.name}</DialogDescription>
          </DialogHeader>
          {selectedUserForReset && (
            <ResetPasswordForm
              user={selectedUserForReset}
              onClose={() => {
                setResetPasswordOpen(false)
                setSelectedUserForReset(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions</DialogDescription>
          </DialogHeader>
          {selectedUserForEdit && (
            <EditUserForm
              user={selectedUserForEdit}
              onClose={() => {
                setEditUserOpen(false)
                setSelectedUserForEdit(null)
              }}
              onUserUpdated={(updatedUser) => {
                setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)))
                setEditUserOpen(false)
                setSelectedUserForEdit(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

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

function EditUserForm({
  user,
  onClose,
  onUserUpdated,
}: {
  user: SystemUser
  onClose: () => void
  onUserUpdated: (user: SystemUser) => void
}) {
  const { user: currentUser } = useAuth()
  const roleColors = currentUser?.role ? getRoleColorScheme(currentUser.role) : null
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    location: user.location,
    department: "ITD",
    password: "",
    changePassword: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      console.log("[v0] Updating user:", formData)

      const response = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update user")
      }

      const result = await response.json()
      console.log("[v0] User updated successfully:", result)

      // Refresh the page to show updated user
      window.location.reload()
    } catch (err: any) {
      console.error("[v0] Error updating user:", err)
      setError(err.message || "Failed to update user. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
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
                <SelectItem value="regional_it_head">Regional IT Head</SelectItem>
                <SelectItem value="it_head">IT Head</SelectItem>
                <SelectItem value="it_store_head">IT Store Head</SelectItem>
                <SelectItem value="service_desk_head">Service Desk Head</SelectItem>
                <SelectItem value="service_desk_staff">Service Desk Staff</SelectItem>
                <SelectItem value="service_provider">Service Provider</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getLocationOptions().map((option) => (
                  <SelectItem key={option.value} value={option.label}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                id="changePassword"
                checked={formData.changePassword}
                onChange={(e) => setFormData({ ...formData, changePassword: e.target.checked, password: "" })}
                className="rounded"
              />
              <label htmlFor="changePassword" className="text-sm font-medium">
                Change Password
              </label>
            </div>
            {formData.changePassword && (
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "text-white",
              roleColors
                ? `bg-gradient-to-r ${roleColors.gradient} ${roleColors.hoverGradient}`
                : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600",
            )}
          >
            {isSubmitting ? "Updating..." : "Update User"}
          </Button>
        </div>
      </form>
    </div>
  )
}

function ResetPasswordForm({ user, onClose }: { user: SystemUser; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          username: user.email,
          newPassword: newPassword,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reset password")
      }

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError("Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <KeyRound className="h-8 w-8 text-green-600" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg">Password Reset Successful</h3>
          <p className="text-sm text-muted-foreground">Password has been updated for {user.name}</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}

      <div className="space-y-2">
        <label className="text-sm font-medium">New Password</label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          required
          minLength={6}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Confirm Password</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          required
          minLength={6}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </Button>
      </div>
    </form>
  )
}

function AddUserForm({ onClose, onUserAdded }: { onClose: () => void; onUserAdded: (user: SystemUser) => void }) {
  const { user } = useAuth()
  const roleColors = user?.role ? getRoleColorScheme(user.role) : null
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "user" as SystemUser["role"],
    location: "Head Office",
    department: "ITD",
    password: "qcc@123", // Updated default password from qccghana123 to qcc@123
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      console.log("[v0] Submitting user creation:", formData)

      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create user")
      }

      const result = await response.json()
      console.log("[v0] User created successfully:", result)

      // Refresh the page to show the new user
      window.location.reload()
    } catch (err: any) {
      console.error("[v0] Error creating user:", err)
      setError(err.message || "Failed to create user. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <FormNavigation currentPage="/dashboard/users" className="mb-4" />

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
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
            <label className="text-sm font-medium">Department</label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({ ...formData, department: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ITD">ITD</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="AUDIT">AUDIT</SelectItem>
                <SelectItem value="ACCOUNTS">ACCOUNTS</SelectItem>
                <SelectItem value="RESEARCH">RESEARCH</SelectItem>
                <SelectItem value="ESTATE">ESTATE</SelectItem>
                <SelectItem value="SECURITY">SECURITY</SelectItem>
                <SelectItem value="OPERATIONS">OPERATIONS</SelectItem>
                <SelectItem value="PROCUREMENT">PROCUREMENT</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="it_store_head">IT Store Head</SelectItem>
                <SelectItem value="service_desk_head">Service Desk Head</SelectItem>
                <SelectItem value="service_desk_staff">Service Desk Staff</SelectItem>
                <SelectItem value="service_provider">Service Provider</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Location</label>
            <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getLocationOptions().map((option) => (
                  <SelectItem key={option.value} value={option.label}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium">Default Password</label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Default password for new user"
            />
            <p className="text-xs text-muted-foreground mt-1">User can change this password after first login</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "text-white",
              roleColors
                ? `bg-gradient-to-r ${roleColors.gradient} ${roleColors.hoverGradient}`
                : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600",
            )}
          >
            {isSubmitting ? "Creating..." : "Create User"}
          </Button>
        </div>
      </form>
    </div>
  )
}
