import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StaffComplaintForm } from "@/components/service-desk/staff-complaint-form"

export default function ComplaintsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <StaffComplaintForm />
      </div>
    </DashboardLayout>
  )
}
