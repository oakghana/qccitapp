"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { MyRepairJobs } from "@/components/service-provider/my-repair-jobs"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function ServiceProviderRepairsPage() {
  const { user } = useAuth()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (user?.id) {
      setIsReady(true)
    }
  }, [user])

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // For service providers, use their profile ID as service provider ID
  const serviceProviderId = user?.id || ""

  return (
    <div className="space-y-6">
      <MyRepairJobs serviceProviderId={serviceProviderId} />
    </div>
  )
}
