"use client"

import { useAuth } from "@/lib/auth-context"
import { RealTimePerformanceDashboard } from "@/components/performance/real-time-performance-dashboard"
import { ITHeadPerformanceManagement } from "@/components/performance/it-head-performance-management"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users } from "lucide-react"

export default function MyPerformancePage() {
  const { user } = useAuth()

  // BSC is restricted to IT staff only
  const allowedRoles = ["it_staff", "it_head", "regional_it_head", "admin"]
  
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Balanced Scorecard performance management is only available to IT department staff.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Contact your IT administrator for access</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // IT Heads see the management view, IT staff see their individual real-time performance
  if (user.role === "it_head" || user.role === "regional_it_head" || user.role === "admin") {
    return <ITHeadPerformanceManagement />
  }

  return <RealTimePerformanceDashboard />
}