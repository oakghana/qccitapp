import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ServiceProviderDashboard } from "@/components/service-provider/service-provider-dashboard"

export default function AssignedRepairsPage() {
  return (
    <DashboardLayout>
      <ServiceProviderDashboard />
    </DashboardLayout>
  )
}
