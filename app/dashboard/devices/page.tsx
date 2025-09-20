import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { DeviceInventory } from "@/components/devices/device-inventory"

export default function DevicesPage() {
  return (
    <DashboardLayout>
      <DeviceInventory />
    </DashboardLayout>
  )
}
