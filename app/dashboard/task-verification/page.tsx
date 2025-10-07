"use client"

import { useAuth } from "@/lib/auth-context"
import { TaskVerificationSystem } from "@/components/performance/task-verification-system"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users } from "lucide-react"

export default function TaskVerificationPage() {
  const { user } = useAuth()

  // Task verification is restricted to IT staff only
  const allowedRoles = ["it_staff", "it_head", "regional_it_head", "admin"]

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access the task verification system.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Task verification system is only available to IT department staff.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>This feature is restricted to IT staff and leadership only</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Map user roles for the component
  const getUserRole = () => {
    switch (user.role) {
      case "it_head":
      case "regional_it_head":
        return "supervisor"
      case "admin":
        return "supervisor"
      default:
        return "staff"
    }
  }

  return (
    <div className="container mx-auto p-6">
      <TaskVerificationSystem 
        userRole={getUserRole()}
        userId={user.id}
      />
    </div>
  )
}