import type { Metadata } from "next"
import { AssignStockToStaff } from "@/components/store/assign-stock-to-staff"

export const metadata: Metadata = {
  title: "Assign Stock to Staff - IT Store",
  description: "Assign stock items from location inventory to staff members",
}

export default function AssignStockPage() {
  return (
    <div className="container mx-auto py-6">
      <AssignStockToStaff />
    </div>
  )
}
