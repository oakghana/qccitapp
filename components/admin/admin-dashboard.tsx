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
  const tabClassName = "flex min-w-[120px] items-center gap-2 rounded-lg px-3 py-2 text-sm"

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card/80 p-4 shadow-sm sm:p-5">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">System Administration</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Monitor users, devices, providers, reports and system controls from one workspace.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex h-auto min-w-full justify-start gap-1 rounded-xl bg-muted/60 p-1">
            <TabsTrigger value="overview" className={tabClassName}>
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className={tabClassName}>
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="department-heads" className={tabClassName}>
              <Layers className="h-4 w-4" />
              <span>Dept Heads</span>
            </TabsTrigger>
            <TabsTrigger value="providers" className={tabClassName}>
              <Building className="h-4 w-4" />
              <span>Providers</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className={tabClassName}>
              <FileText className="h-4 w-4" />
              <span>Reports</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className={tabClassName}>
              <Activity className="h-4 w-4" />
              <span>Audit</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className={tabClassName}>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>

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
