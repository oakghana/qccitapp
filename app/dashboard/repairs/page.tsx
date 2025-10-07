"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ITHeadRepairManagement } from "@/components/repairs/it-head-repair-management"
import { ITHeadRepairReports } from "@/components/reports/it-head-repair-reports"
import { Wrench, BarChart3 } from "lucide-react"

export default function RepairsPage() {
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
