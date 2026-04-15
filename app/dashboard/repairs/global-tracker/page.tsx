"use client"

import { useEffect, useState } from "react"
import { GlobalRepairTracker } from "@/components/repairs/global-repair-tracker"
import { Loader2 } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function GlobalRepairTrackerPage() {
  const { data: providersData, isLoading } = useSWR(
    `/api/service-providers`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const providers = providersData?.providers || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GlobalRepairTracker allServiceProviders={providers} />
    </div>
  )
}
