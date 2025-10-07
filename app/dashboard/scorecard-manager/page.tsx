"use client"

import { useAuth } from "@/lib/auth-context"
import { DynamicBalancedScorecardManager } from "@/components/performance/dynamic-balanced-scorecard-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users } from "lucide-react"

export default function ScoreCardManagerPage() {
  const { user } = useAuth()

  // Scorecard Manager is restricted to IT leadership roles only
  const allowedRoles = ["it_head", "regional_it_head", "admin"]
  
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              Scorecard Manager is only available to IT department leadership (IT Heads and Regional IT Heads).
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Contact your IT Head for scorecard assignments</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <DynamicBalancedScorecardManager />
}