"use client"

import { RequestStatusTracker } from "@/components/it-forms/request-status-tracker"

export default function MyRequisitionsPage() {
  return (
    <div className="container mx-auto py-6">
      <RequestStatusTracker />
    </div>
  )
}
