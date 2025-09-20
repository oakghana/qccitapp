import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default function AdminPage() {
  return (
    <DashboardLayout>
      <AdminDashboard />
    </DashboardLayout>
  )
}
