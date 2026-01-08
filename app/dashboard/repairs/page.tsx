"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ITHeadRepairManagement } from "@/components/repairs/it-head-repair-management"
import { ITHeadRepairReports } from "@/components/reports/it-head-repair-reports"
import { Wrench, BarChart3, ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RepairsPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !["it_staff", "it_store_head", "it_head", "regional_it_head", "admin"].includes(user.role)) {
      router.push("/dashboard")
    }
  }, [user, router])

  if (user && !["it_staff", "it_store_head", "it_head", "regional_it_head", "admin"].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-6 w-6" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>
              You do not have permission to access repair management. Please submit a service desk request for IT
              support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Only IT staff members can create and manage repair tasks. If you need IT assistance, please use the
              Service Desk to submit a support request.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="management" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Repair Management
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics & Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-0">
          <ITHeadRepairManagement />
        </TabsContent>

        <TabsContent value="reports" className="space-y-0">
          <ITHeadRepairReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
