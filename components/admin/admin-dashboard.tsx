"use client"

import { useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { SystemOverview } from "./system-overview"
import { UserManagement } from "./user-management"
import { ServiceProviderManagement } from "./service-provider-management"
import { DepartmentHeadLinking } from "./department-head-linking"
import { SystemSettings } from "./system-settings"
import { AuditLogs } from "./audit-logs"
import { Reports } from "./reports"
import { Activity, ArrowRight, BarChart3, Building, FileText, Layers, Search, Settings, Users } from "lucide-react"

const tabs = [
  {
    value: "overview",
    label: "Overview",
    description: "System health, approvals and quick insight",
    icon: BarChart3,
  },
  {
    value: "users",
    label: "Users",
    description: "Add, edit and activate accounts fast",
    icon: Users,
  },
  {
    value: "department-heads",
    label: "Dept Heads",
    description: "Map staff to department heads",
    icon: Layers,
  },
  {
    value: "providers",
    label: "Providers",
    description: "Manage service partners and contacts",
    icon: Building,
  },
  {
    value: "reports",
    label: "Reports",
    description: "Review trends and exports",
    icon: FileText,
  },
  {
    value: "audit",
    label: "Audit",
    description: "Track actions and accountability",
    icon: Activity,
  },
  {
    value: "settings",
    label: "Settings",
    description: "Control system-wide defaults",
    icon: Settings,
  },
] as const

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const tabClassName = "flex min-w-[120px] items-center gap-2 rounded-lg px-3 py-2 text-sm"

  const quickAccessCards = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) {
      return tabs
    }

    return tabs.filter((tab) => {
      return tab.label.toLowerCase().includes(query) || tab.description.toLowerCase().includes(query)
    })
  }, [searchTerm])

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border bg-gradient-to-r from-slate-950 via-slate-900 to-orange-950 p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">Admin workspace</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">System Administration</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200 sm:text-base">
              A cleaner control center for user access, service partners, audit trails and reporting.
            </p>
          </div>

          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Find a task or admin area"
                className="border-white/10 bg-white/90 pl-9 text-slate-900 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {quickAccessCards.map((tab) => {
          const Icon = tab.icon

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className="rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl bg-orange-100 p-2 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <h2 className="mt-3 text-base font-semibold text-foreground">{tab.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{tab.description}</p>
            </button>
          )
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex h-auto min-w-full justify-start gap-1 rounded-xl bg-muted/60 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger key={tab.value} value={tab.value} className={tabClassName}>
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </TabsTrigger>
              )
            })}
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
