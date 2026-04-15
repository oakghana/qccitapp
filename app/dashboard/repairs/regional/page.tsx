"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { RegionalRepairView } from "@/components/repairs/regional-repair-view"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"

export default function RegionalRepairsPage() {
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

  // Check if user is a regional IT head
  if (user?.role !== "regional_it_head") {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-sm text-muted-foreground">
            This page is only accessible to Regional IT Heads
          </p>
        </CardContent>
      </Card>
    )
  }

  const regionId = user?.location || ""
  const regionName = user?.location || "Your Region"

  if (!regionId) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-sm text-muted-foreground">
            Unable to determine your region. Please contact admin.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <RegionalRepairView regionId={regionId} regionName={regionName} />
    </div>
  )
}
