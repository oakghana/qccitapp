"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Clock, Mail, MapPin, Phone, Briefcase, Search } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getLocationLabel } from "@/lib/locations"

interface PendingUser {
  id: string
  username: string
  email: string
  fullName: string
  phone?: string
  department?: string
  location: string
  createdAt: string
  status: "pending" | "approved" | "rejected"
  role?: string
}

export function UserApprovalManagement() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [approvedUsers, setApprovedUsers] = useState<PendingUser[]>([])
  const [rejectedUsers, setRejectedUsers] = useState<PendingUser[]>([])
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<"approve" | "reject">("approve")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // Fetch pending users
      const pendingRes = await fetch("/api/admin/pending-users?status=pending")
      const pendingData = await pendingRes.json()

      // Fetch approved users
      const approvedRes = await fetch("/api/admin/pending-users?status=approved")
      const approvedData = await approvedRes.json()

      // Fetch rejected users
      const rejectedRes = await fetch("/api/admin/pending-users?status=rejected")
      const rejectedData = await rejectedRes.json()

      // Map the data to the expected format
      setPendingUsers(
        (pendingData.users || []).map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          department: user.department,
          location: user.location,
          createdAt: user.created_at,
          status: user.status,
          role: user.role,
        })),
      )

      setApprovedUsers(
        (approvedData.users || []).map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          department: user.department,
          location: user.location,
          createdAt: user.created_at,
          status: user.status,
          role: user.role,
        })),
      )

      setRejectedUsers(
        (rejectedData.users || []).map((user: any) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          department: user.department,
          location: user.location,
          createdAt: user.created_at,
          status: user.status,
          role: user.role,
        })),
      )
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleApprove = (user: PendingUser) => {
    setSelectedUser(user)
    setActionType("approve")
    setIsDialogOpen(true)
  }

  const handleReject = (user: PendingUser) => {
    setSelectedUser(user)
    setActionType("reject")
    setIsDialogOpen(true)
  }

  const confirmAction = async () => {
    if (!selectedUser) return

    setIsLoading(true)
    try {
      if (actionType === "approve") {
        const response = await fetch("/api/admin/approve-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUser.id,
            role: selectedRole,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to approve user")
        }
      } else {
        const response = await fetch("/api/admin/reject-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selectedUser.id }),
        })

        if (!response.ok) {
          throw new Error("Failed to reject user")
        }
      }

      await fetchUsers()
      setIsDialogOpen(false)
      setSelectedUser(null)
      setSelectedRole("")
    } catch (error) {
      console.error("Error processing user action:", error)
      alert("Failed to process user action. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: "Admin",
      it_head: "IT Head",
      it_staff: "IT Staff",
      it_store_head: "IT Store Head",
      staff: "Staff",
      service_provider: "Service Provider",
    }
    return roles[role] || role
  }

  const filteredPendingUsers = pendingUsers.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Approval Management</CardTitle>
          <CardDescription>Review and approve user registration requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending ({pendingUsers.length})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedUsers.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedUsers.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {filteredPendingUsers.length === 0 ? (
                <Alert>
                  <AlertDescription>No pending user approvals at this time.</AlertDescription>
                </Alert>
              ) : (
                filteredPendingUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-semibold text-lg">
                              {user.fullName.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{user.fullName}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                {user.email}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{getLocationLabel(user.location)}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                            {user.department && (
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-muted-foreground" />
                                <span>{user.department}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(user)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleReject(user)}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4">
              {approvedUsers.length === 0 ? (
                <Alert>
                  <AlertDescription>No approved users yet.</AlertDescription>
                </Alert>
              ) : (
                approvedUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{user.fullName}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">{getRoleLabel(user.role || "")}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {rejectedUsers.length === 0 ? (
                <Alert>
                  <AlertDescription>No rejected users.</AlertDescription>
                </Alert>
              ) : (
                rejectedUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{user.fullName}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant="destructive">Rejected</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "approve" ? "Approve User" : "Reject User"}</DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Assign a role to grant access to the system"
                : "Are you sure you want to reject this user registration?"}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">{selectedUser.fullName}</p>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                <p className="text-sm text-muted-foreground">{getLocationLabel(selectedUser.location)}</p>
              </div>

              {actionType === "approve" && (
                <div className="space-y-2">
                  <Label htmlFor="role">Assign Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="it_staff">IT Staff</SelectItem>
                      <SelectItem value="it_store_head">IT Store Head</SelectItem>
                      <SelectItem value="it_head">IT Head</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={isLoading || (actionType === "approve" && !selectedRole)}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={actionType === "reject" ? "destructive" : "default"}
            >
              {isLoading ? "Processing..." : actionType === "approve" ? "Approve & Assign Role" : "Reject User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
