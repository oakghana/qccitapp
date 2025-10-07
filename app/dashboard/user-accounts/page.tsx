"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle,
  Shield,
  AlertTriangle
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { FormNavigation } from "@/components/ui/form-navigation"
import { getRoleColorScheme } from "@/lib/role-colors"
import { cn } from "@/lib/utils"
import { CreateUserForm, PendingUser } from "@/components/auth/create-user-form"
import { PendingUserApprovals } from "@/components/admin/pending-user-approvals"

export default function UserAccountsPage() {
  const { user } = useAuth()
  const roleColors = user?.role ? getRoleColorScheme(user.role) : null
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  
  const isAdmin = user?.role === "admin"
  const canCreateUsers = user?.role !== undefined // All authenticated users can create requests

  const handleUserCreated = (newUser: PendingUser) => {
    setPendingUsers(prev => [newUser, ...prev])
  }

  // Stats for admin dashboard
  const stats = {
    pending: pendingUsers.filter(u => u.status === "pending").length,
    approved: pendingUsers.filter(u => u.status === "approved").length,
    rejected: pendingUsers.filter(u => u.status === "rejected").length,
  }

  return (
    <div className="space-y-6">
      <FormNavigation currentPage="/dashboard/user-accounts" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Account Management</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Create user requests and manage pending approvals" 
              : "Submit requests for new user accounts"}
          </p>
        </div>
        
        {/* Quick Stats for Admin */}
        {isAdmin && (
          <div className="flex space-x-2">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
              <Clock className="mr-1 h-3 w-3" />
              {stats.pending} Pending
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
              <CheckCircle className="mr-1 h-3 w-3" />
              {stats.approved} Approved
            </Badge>
          </div>
        )}
      </div>

      {/* Permission Check */}
      {!canCreateUsers && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Access Required</h3>
            <p className="text-red-700 dark:text-red-300">
              You need to be logged in to access user account management features.
            </p>
          </CardContent>
        </Card>
      )}

      {canCreateUsers && (
        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="create" className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Create Request</span>
            </TabsTrigger>
            <TabsTrigger 
              value="approvals" 
              className="flex items-center space-x-2"
              disabled={!isAdmin}
            >
              <Shield className="h-4 w-4" />
              <span>Approvals</span>
              {!isAdmin && <Badge variant="secondary" className="ml-1 text-xs">Admin</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Create User Request Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card className={cn(
              roleColors ? `${roleColors.background}` : "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950"
            )}>
              <CardHeader className="text-center">
                <div className={cn(
                  "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4",
                  roleColors ? `${roleColors.background}` : "bg-blue-100 dark:bg-blue-800"
                )}>
                  <UserPlus className={cn(
                    "h-8 w-8",
                    roleColors ? roleColors.textPrimary : "text-blue-600 dark:text-blue-400"
                  )} />
                </div>
                <CardTitle className={cn(
                  "text-2xl",
                  roleColors ? roleColors.textPrimary : "text-blue-900 dark:text-blue-100"
                )}>
                  New User Account Request
                </CardTitle>
                <CardDescription className={cn(
                  roleColors ? roleColors.textSecondary : "text-blue-700 dark:text-blue-300"
                )}>
                  Staff members can submit requests for new user accounts. All requests require administrator approval before the user can access the system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <div className="w-12 h-12 mx-auto bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center mb-2">
                        <UserPlus className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h4 className="font-semibold text-sm">Submit Request</h4>
                      <p className="text-xs text-muted-foreground">Fill out the user details and business justification</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <div className="w-12 h-12 mx-auto bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center mb-2">
                        <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <h4 className="font-semibold text-sm">Admin Review</h4>
                      <p className="text-xs text-muted-foreground">Administrator reviews and approves within 24-48 hours</p>
                    </CardContent>
                  </Card>
                  <Card className="text-center">
                    <CardContent className="p-4">
                      <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mb-2">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <h4 className="font-semibold text-sm">Account Active</h4>
                      <p className="text-xs text-muted-foreground">User receives credentials and can access the system</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <CreateUserForm onUserCreated={handleUserCreated} />
          </TabsContent>

          {/* Approvals Tab (Admin Only) */}
          <TabsContent value="approvals" className="space-y-6">
            {isAdmin ? (
              <PendingUserApprovals />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Administrator Access Required</h3>
                  <p className="text-muted-foreground">
                    Only system administrators can view and process user account approval requests.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Help Information */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">How User Account Creation Works</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>Staff Members:</strong> Can submit requests for new user accounts with business justification</li>
                <li>• <strong>Pending Status:</strong> All requests start as "pending" and require admin approval</li>
                <li>• <strong>Admin Review:</strong> Administrators review requests, assign roles, and activate accounts</li>
                <li>• <strong>Role Assignment:</strong> Only admins can assign user roles and system permissions</li>
                <li>• <strong>Account Activation:</strong> Users cannot access the system until their account is approved and activated</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}