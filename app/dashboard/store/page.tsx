"use client"

import { useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import StoreHeadDashboard from "@/components/store/store-head-dashboard"
import { RequisitionManagement } from "@/components/store/requisition-management"
import { RegionalStoreRequisitions } from "@/components/store/regional-store-requisitions"
import StoreSummaryReportPage from "@/app/dashboard/store-summary-report/page"
import { useAuth } from "@/lib/auth-context"

export default function StoreIndexPage() {
  const { user } = useAuth()

  const perms = useMemo(() => {
    const role = user?.role
    return {
      canOverview: !!role && ["admin", "it_store_head", "regional_it_head", "it_head"].includes(role),
      canSummary: !!role && ["admin", "it_store_head", "it_staff", "it_head", "regional_it_head"].includes(role),
      canRequisitions: !!role && ["admin", "it_store_head", "regional_it_head", "it_head"].includes(role),
    }
  }, [user?.role])

  const tabs = [] as { id: string; label: string }[]
  if (perms.canOverview) tabs.push({ id: "overview", label: "Overview" })
  if (perms.canSummary) tabs.push({ id: "summary", label: "Summary Report" })
  if (perms.canRequisitions) tabs.push({ id: "requisitions", label: "Requisitions" })

  if (tabs.length === 0) {
    return <div className="container mx-auto py-6">You do not have access to Store pages.</div>
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Store</h1>

      <Tabs defaultValue={tabs[0].id}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {perms.canOverview && (
          <TabsContent value="overview" className="mt-4">
            <StoreHeadDashboard />
          </TabsContent>
        )}

        {perms.canSummary && (
          <TabsContent value="summary" className="mt-4">
            {/* Reuse existing summary page component */}
            <StoreSummaryReportPage />
          </TabsContent>
        )}

        {perms.canRequisitions && (
          <TabsContent value="requisitions" className="mt-4">
            {/* Show both management and regional components where appropriate */}
            {user?.role === "regional_it_head" ? (
              <RegionalStoreRequisitions />
            ) : (
              <RequisitionManagement />
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
