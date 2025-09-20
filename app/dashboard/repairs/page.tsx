import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { RepairWorkflow } from "@/components/repairs/repair-workflow"

export default function RepairsPage() {
  return (
    <DashboardLayout>
      <RepairWorkflow />
    </DashboardLayout>
  )
}
