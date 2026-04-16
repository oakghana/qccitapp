"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Eye,
  Lock,
  LogOut,
  Settings,
  FileText,
  TrendingUp,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface StaffMember {
  id: string
  full_name: string
  email: string
  username: string
  department: string
  role: string
  is_approved: boolean
  is_active: boolean
  created_at: string
}

interface StockItem {
  id: string
  item_name: string
  quantity: number
  unit: string
  category: string
}

interface DepartmentDevice {
  id: string
  device_name: string
  device_type: string
  serial_number: string
  asset_tag?: string
  status: "active" | "repair" | "maintenance" | "retired"
  assigned_to?: string
  location?: string
}

interface ServiceDeskRequest {
  id: string
  task_number: string
  device_name: string
  issue_description: string
  priority: "low" | "medium" | "high" | "critical"
  status: string
  assigned_to?: string
  created_at: string
}

export function DepartmentHeadDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [showStaffDetailsDialog, setShowStaffDetailsDialog] = useState(false)
  
  // New state for stock, devices, and requests
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [departmentDevices, setDepartmentDevices] = useState<DepartmentDevice[]>([])
  const [serviceDeskRequests, setServiceDeskRequests] = useState<ServiceDeskRequest[]>([])
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const { data: dashboardStats } = useSWR("/api/dashboard/badge-counts", fetcher)
  const { data: requisitionsData } = useSWR(
    "/api/it-forms/department-head-requisitions",
    fetcher
  )

  useEffect(() => {
    fetchStaffMembers()
    fetchStockItems()
    fetchDepartmentDevices()
    fetchServiceDeskRequests()
  }, [])

  useEffect(() => {
    filterStaff()
  }, [searchTerm, staffMembers])

  const fetchStaffMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/staff/department-members")
      const data = await response.json()
      if (data.success) {
        setStaffMembers(data.staff || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching staff:", error)
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterStaff = () => {
    if (!searchTerm) {
      setFilteredStaff(staffMembers)
      return
    }

    const filtered = staffMembers.filter(
      (staff) =>
        staff.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredStaff(filtered)
  }

  const fetchStockItems = async () => {
    try {
      const response = await fetch("/api/store/stock-items?viewOnly=true")
      const data = await response.json()
      if (data.success) {
        setStockItems(data.items || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching stock items:", error)
    }
  }

  const fetchDepartmentDevices = async () => {
    try {
      const response = await fetch("/api/devices/department-devices")
      const data = await response.json()
      if (data.success) {
        setDepartmentDevices(data.devices || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching department devices:", error)
    }
  }

  const fetchServiceDeskRequests = async () => {
    try {
      const response = await fetch("/api/repairs/service-desk-requests?department=true")
      const data = await response.json()
      if (data.success) {
        setServiceDeskRequests(data.requests || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching service desk requests:", error)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: result.error || "Failed to change password",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Password changed successfully",
      })
      setShowPasswordDialog(false)
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("[v0] Error changing password:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Department Head Portal</h1>
            <p className="text-slate-400">Welcome back, {user?.full_name}</p>
          </div>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowPasswordDialog(true)}
            className="gap-2 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 text-white"
          >
            <Lock className="h-4 w-4" />
            Change Password
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                Staff Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{staffMembers.length}</div>
              <p className="text-xs text-slate-400 mt-1">In your department</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {requisitionsData?.pending_count || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Awaiting your decision</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                Approved This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {requisitionsData?.approved_this_month || 0}
              </div>
              <p className="text-xs text-slate-400 mt-1">Total approved</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 p-1">
            <TabsTrigger value="overview" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="staff" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Staff Management
            </TabsTrigger>
            <TabsTrigger value="stock" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              IT Stock Levels
            </TabsTrigger>
            <TabsTrigger value="devices" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Department Devices
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Service Desk Requests
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Account Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Recent IT Form Requests</CardTitle>
                <CardDescription className="text-slate-400">Forms requiring your approval</CardDescription>
              </CardHeader>
              <CardContent>
                {requisitionsData?.recent?.length > 0 ? (
                  <div className="space-y-3">
                    {requisitionsData.recent.map((req: any) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/50 hover:border-slate-500/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-white">{req.requisition_number}</p>
                            <p className="text-sm text-slate-400 mt-1">
                              Requested by: {req.staff_name}
                            </p>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                              Items: {req.items_required}
                            </p>
                          </div>
                          <Badge
                            className={`${
                              ["pending_department_head", "pending"].includes(req.status)
                                ? "bg-amber-500/20 text-amber-200"
                                : "bg-green-500/20 text-green-200"
                            }`}
                          >
                            {req.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-6">No pending requests</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Management Tab */}
          <TabsContent value="staff" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Your Staff Members</CardTitle>
                    <CardDescription className="text-slate-400">
                      Manage and view all staff in your department
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search by name, email, or username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-700/30 border-slate-600/50 text-white placeholder:text-slate-500"
                  />
                </div>

                {/* Staff List */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : filteredStaff.length > 0 ? (
                  <div className="space-y-3">
                    {filteredStaff.map((staff) => (
                      <div
                        key={staff.id}
                        className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/50 hover:border-slate-500/50 transition-all hover:bg-slate-700/40 group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-white">{staff.full_name}</p>
                            <p className="text-sm text-slate-400">{staff.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                className={`${
                                  staff.is_active
                                    ? "bg-green-500/20 text-green-200"
                                    : "bg-red-500/20 text-red-200"
                                }`}
                              >
                                {staff.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <Badge
                                className={`${
                                  staff.is_approved
                                    ? "bg-blue-500/20 text-blue-200"
                                    : "bg-yellow-500/20 text-yellow-200"
                                }`}
                              >
                                {staff.is_approved ? "Approved" : "Pending"}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(staff)
                              setShowStaffDetailsDialog(true)
                            }}
                            className="text-slate-400 hover:text-white hover:bg-slate-600/50 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-600 mx-auto mb-2 opacity-50" />
                    <p className="text-slate-400">No staff members found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Account Information</CardTitle>
                <CardDescription className="text-slate-400">
                  Your profile details (read-only)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-slate-700/30 border-slate-600/50 text-slate-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You cannot change your name, email, or department. Only password changes are allowed.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-300 text-sm">Full Name</Label>
                    <div className="mt-1 p-3 rounded-lg bg-slate-700/20 border border-slate-600/30 text-white">
                      {user?.full_name}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Email</Label>
                    <div className="mt-1 p-3 rounded-lg bg-slate-700/20 border border-slate-600/30 text-white">
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Username</Label>
                    <div className="mt-1 p-3 rounded-lg bg-slate-700/20 border border-slate-600/30 text-white">
                      {user?.username}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">Department</Label>
                    <div className="mt-1 p-3 rounded-lg bg-slate-700/20 border border-slate-600/30 text-white">
                      {user?.department}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowPasswordDialog(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 mt-4"
                >
                  <Lock className="h-4 w-4" />
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IT Stock Levels Tab */}
          <TabsContent value="stock" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  IT Stock Levels (View Only)
                </CardTitle>
                <CardDescription className="text-slate-400">Current stock availability in the IT department</CardDescription>
              </CardHeader>
              <CardContent>
                {stockItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-600/50">
                          <th className="text-left py-3 px-2 text-slate-300 font-medium">Item Name</th>
                          <th className="text-left py-3 px-2 text-slate-300 font-medium">Category</th>
                          <th className="text-left py-3 px-2 text-slate-300 font-medium">Quantity</th>
                          <th className="text-left py-3 px-2 text-slate-300 font-medium">Unit</th>
                          <th className="text-left py-3 px-2 text-slate-300 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockItems.map((item) => (
                          <tr key={item.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                            <td className="py-3 px-2 text-white">{item.item_name}</td>
                            <td className="py-3 px-2 text-slate-400">{item.category}</td>
                            <td className="py-3 px-2 text-slate-400">{item.quantity}</td>
                            <td className="py-3 px-2 text-slate-400">{item.unit}</td>
                            <td className="py-3 px-2">
                              <Badge className={item.quantity > 10 ? "bg-green-500/20 text-green-200" : item.quantity > 0 ? "bg-amber-500/20 text-amber-200" : "bg-red-500/20 text-red-200"}>
                                {item.quantity > 10 ? "In Stock" : item.quantity > 0 ? "Low Stock" : "Out of Stock"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-6">No stock items available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Department Devices Tab */}
          <TabsContent value="devices" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Department Devices (View Only)</CardTitle>
                <CardDescription className="text-slate-400">All devices assigned to your department</CardDescription>
              </CardHeader>
              <CardContent>
                {departmentDevices.length > 0 ? (
                  <div className="space-y-3">
                    {departmentDevices.map((device) => (
                      <div key={device.id} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/50 hover:border-slate-500/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-white">{device.device_name}</p>
                            <p className="text-sm text-slate-400">Type: {device.device_type}</p>
                          </div>
                          <Badge className={device.status === "active" ? "bg-green-500/20 text-green-200" : device.status === "repair" ? "bg-red-500/20 text-red-200" : "bg-amber-500/20 text-amber-200"}>
                            {device.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mt-2">
                          <div>Serial: {device.serial_number}</div>
                          {device.asset_tag && <div>Asset Tag: {device.asset_tag}</div>}
                          {device.assigned_to && <div>Assigned to: {device.assigned_to}</div>}
                          {device.location && <div>Location: {device.location}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-6">No devices found for your department</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Desk Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 border-slate-700/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Service Desk Requests (View Only)</CardTitle>
                <CardDescription className="text-slate-400">Repair and maintenance requests from your department</CardDescription>
              </CardHeader>
              <CardContent>
                {serviceDeskRequests.length > 0 ? (
                  <div className="space-y-3">
                    {serviceDeskRequests.map((request) => (
                      <div key={request.id} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/50 hover:border-slate-500/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-white">{request.task_number}</p>
                            <p className="text-sm text-slate-400 mt-1">{request.device_name}</p>
                            <p className="text-sm text-slate-400 mt-1">{request.issue_description}</p>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Badge className={
                              request.priority === "critical" ? "bg-red-500/20 text-red-200" :
                              request.priority === "high" ? "bg-orange-500/20 text-orange-200" :
                              request.priority === "medium" ? "bg-yellow-500/20 text-yellow-200" :
                              "bg-green-500/20 text-green-200"
                            }>
                              {request.priority}
                            </Badge>
                            <Badge className="bg-blue-500/20 text-blue-200">
                              {request.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 mt-2 flex justify-between">
                          <span>Created: {new Date(request.created_at).toLocaleDateString()}</span>
                          {request.assigned_to && <span>Assigned to: {request.assigned_to}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-6">No service desk requests found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Change Password</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your current password and your new password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password" className="text-slate-200">
                Current Password
              </Label>
              <Input
                id="current-password"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                className="mt-1 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="new-password" className="text-slate-200">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                className="mt-1 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-slate-200">
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="mt-1 bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={isChangingPassword}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Staff Details Dialog */}
      {selectedStaff && (
        <Dialog open={showStaffDetailsDialog} onOpenChange={setShowStaffDetailsDialog}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Staff Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">Full Name</Label>
                <p className="text-white mt-1">{selectedStaff.full_name}</p>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Email</Label>
                <p className="text-white mt-1">{selectedStaff.email}</p>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Username</Label>
                <p className="text-white mt-1">{selectedStaff.username}</p>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Role</Label>
                <p className="text-white mt-1 capitalize">{selectedStaff.role}</p>
              </div>
              <div className="pt-2">
                <Label className="text-slate-300 text-sm mb-2 block">Status</Label>
                <div className="flex gap-2">
                  <Badge
                    className={`${
                      selectedStaff.is_active
                        ? "bg-green-500/20 text-green-200"
                        : "bg-red-500/20 text-red-200"
                    }`}
                  >
                    {selectedStaff.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge
                    className={`${
                      selectedStaff.is_approved
                        ? "bg-blue-500/20 text-blue-200"
                        : "bg-yellow-500/20 text-yellow-200"
                    }`}
                  >
                    {selectedStaff.is_approved ? "Approved" : "Pending"}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
