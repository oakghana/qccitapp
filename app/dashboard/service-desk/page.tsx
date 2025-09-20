import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ServiceDeskDashboard } from "@/components/service-desk/service-desk-dashboard"

export default function ServiceDeskPage() {
  return (
    <DashboardLayout>
      <ServiceDeskDashboard />
    </DashboardLayout>
  )
}
