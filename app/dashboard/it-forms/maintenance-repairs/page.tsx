"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MaintenanceRepairsForm } from "@/components/it-forms/maintenance-repairs-form"
import { RequestStatusTracker } from "@/components/it-forms/request-status-tracker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wrench } from "lucide-react"

export default function MaintenanceRepairsPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleFormSubmit = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/10 rounded-lg">
          <Wrench className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance & Repairs Request</h1>
          <p className="text-muted-foreground mt-1">
            Submit requests for IT equipment maintenance and repairs
          </p>
        </div>
      </div>

      <Tabs defaultValue="new-request" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-request">New Request</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="new-request" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance and Repairs Request Form</CardTitle>
              <CardDescription>
                Complete all applicable sections below. Section B onwards will be filled by IT staff.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MaintenanceRepairsForm onSubmit={handleFormSubmit} key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-requests">
          <Card>
            <CardHeader>
              <CardTitle>My Maintenance Requests</CardTitle>
              <CardDescription>
                View the status of your submitted maintenance and repair requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequestStatusTracker
                formType="maintenance"
                title="My Maintenance Requests"
                description="Review submitted maintenance forms, edit drafts, and download PDF copies."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
