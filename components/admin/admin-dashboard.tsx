"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SystemOverview } from "./system-overview"
import { UserManagement } from "./user-management"
import { ServiceProviderManagement } from "./service-provider-management"
import { DepartmentHeadLinking } from "./department-head-linking"
import { SystemSettings } from "./system-settings"
import { AuditLogs } from "./audit-logs"
import { Reports } from "./reports"
import { BarChart3, Users, Building, Settings, FileText, Activity, Layers } from "lucide-react"

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Administration</h1>
        <p className="text-muted-foreground">Comprehensive system management and oversight</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="department-heads" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Dept Heads</span>
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Providers</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SystemOverview />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="department-heads" className="space-y-4">
          <DepartmentHeadLinking />
        </TabsContent>

        <TabsContent value="providers" className="space-y-4">
          <ServiceProviderManagement />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Reports />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditLogs />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SystemSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
