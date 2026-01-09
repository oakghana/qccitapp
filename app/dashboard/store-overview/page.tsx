import type { Metadata } from "next"
import StoreHeadDashboard from "@/components/store/store-head-dashboard"

export const metadata: Metadata = {
  title: "Store Overview - All Locations",
  description: "Comprehensive inventory view across all locations",
}

export default function StoreOverviewPage() {
  return (
    <div className="container mx-auto py-6">
      <StoreHeadDashboard />
    </div>
  )
}
