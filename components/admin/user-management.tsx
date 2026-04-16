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
  Users,
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
import { CreateUserForm } from "@/components/auth/create-user-form"
import { usePWAInstall } from "@/components/ui/pwa-install"
import { getRoleColorScheme } from "@/lib/role-colors"
import { cn, formatDisplayDate } from "@/lib/utils"
import { createClient } from "@/supabase/supabase-client"
import { getLocationOptions, LOCATIONS } from "@/lib/locations"
import { getCanonicalLocationName } from "@/lib/location-filter"
import { useToast } from "@/hooks/use-toast"

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
    | "department_head"
    | "service_desk_accra"
    | "service_desk_kumasi"
    | "service_desk_tema"
    | "service_desk_takoradi"
    | "service_desk_cape_coast"
    | "service_desk_ho"
  location: string
  department?: string
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
  department_head: "secondary",
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
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const { isInstalled, isInstallable } = usePWAInstall()
  const [users, setUsers] = useState<SystemUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const roleColors = currentUser?.role ? getRoleColorScheme(currentUser.role) : null
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
        console.log("[v0] Loading users from API...")

        const response = await fetch("/api/users/list")

        if (!response.ok) {
          console.error("[v0] Error loading users:", await response.text())
          return
        }

        const { users: fetchedUsers, currentUserRole } = await response.json()
        console.log("[v0] Loaded users from API:", fetchedUsers)

        const mappedUsers: SystemUser[] = fetchedUsers.map((profile: any) => ({
          id: profile.id,
          name: profile.full_name || profile.username || "Unnamed User",
          email: profile.email || profile.username || "",
          phone: profile.phone || "",
          role: profile.role,
          location: profile.location || "Head Office",
          status:
            !profile.is_active || profile.status === "suspended"
              ? "suspended"
              : profile.status === "approved"
                ? "active"
                : "inactive",
          lastLogin: profile.updated_at,
          createdDate: formatDisplayDate(profile.created_at, "N/A"),
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

    if (currentUser && !canSeeAllLocations(currentUser) && currentUser?.location) {
      filteredByAccess = users.filter((u) => u.location === currentUser.location)
    }

    return filteredByAccess.filter((user) => {
      const normalizedSearch = searchTerm.toLowerCase()
      const matchesSearch =
        (user.name || "").toLowerCase().includes(normalizedSearch) ||
        (user.email || "").toLowerCase().includes(normalizedSearch) ||
        (user.id || "").toLowerCase().includes(normalizedSearch)

      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesLocation = locationFilter === "all" || getCanonicalLocationName(user.location) === locationFilter

      return matchesSearch && matchesRole && matchesLocation
    })
  }

  const filteredUsers = getFilteredUsers()

  const getLocationFilterOptions = () => {
    const allOptions = getLocationOptions()

    if (currentUser?.role === "it_head" && currentUser?.location !== "Head Office") {
      return [
        { value: "all", label: "All Locations" },
        { value: currentUser.location, label: currentUser.location },
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
          toast({
            title: "❌ Failed to Delete User",
            description: "Failed to delete user. Please try again.",
            variant: "destructive",
          })
          return
        }

        // Remove from UI
        setUsers(users.filter((user) => user.id !== userId))
        toast({
          title: "🗑️ User Deleted Successfully",
          description: "The user account has been removed",
        })
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
          toast({
            title: "❌ Failed to Update User Status",
            description: "Failed to update user status. Please try again.",
            variant: "destructive",
          })
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
        
        const actionNames = {
          activate: "activated",
          deactivate: "deactivated",
          suspend: "suspended",
        }
        toast({
          title: `✅ User ${actionNames[action]}`,
          description: `User account has been ${actionNames[action]} successfully`,
        })
      }
    } catch (error) {
      console.error("[v0] Error in handleUserAction:", error)
      toast({
        title: "❌ Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
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
            {currentUser?.role === "it_head" && currentUser?.location !== "Head Office"
              ? `Manage users in ${currentUser.location}`
              : "Manage system users and access permissions"}
          </p>
        </div>

        <div className="flex gap-2">
          {currentUser?.role === "admin" && (
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

          {currentUser?.role === "admin" && (
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
                <CreateUserForm
                  onClose={() => setAddUserOpen(false)}
                  onUserCreated={(newUser) => {
                    setUsers((prev) => [
                      {
                        id: newUser.id,
                        name: newUser.name || "New User",
                        email: newUser.email || "",
                        phone: newUser.phone || "",
                        role: "staff",
                        location: newUser.location || "Head Office",
                        department: newUser.department || "",
                        status: "inactive",
                        lastLogin: newUser.requestedDate || new Date().toISOString(),
                        createdDate: formatDisplayDate(newUser.requestedDate, "N/A"),
                        deviceCount: 0,
                      },
                      ...prev,
                    ])
                    setAddUserOpen(false)
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
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
                <SelectItem value="department_head">Department Head</SelectItem>
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

      {/* User Table */}
      <Card className="bg-slate-900/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users Directory
          </CardTitle>
          <CardDescription className="text-slate-400">Manage all system users and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for users table */}
          <div className="text-slate-400 text-center py-6">Users table would be displayed here</div>
        </CardContent>
      </Card>
    </div>
  )
}
