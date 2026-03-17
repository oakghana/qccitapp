import { Metadata } from "next"
import { AssignITDevicesComponent } from "@/components/devices/assign-it-devices"

export const metadata: Metadata = {
  title: "Assign IT Devices",
  description: "Assign IT devices to staff members",
}

export default function AssignITDevicesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Assign IT Devices</h1>
        <p className="text-gray-600 mt-1">
          Assign IT devices directly to any staff member without requiring approval
        </p>
      </div>

      <AssignITDevicesComponent />
    </div>
  )
}
