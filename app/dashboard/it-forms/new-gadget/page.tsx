"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NewGadgetRequestForm } from "@/components/it-forms/new-gadget-request-form"
import { RequestStatusTracker } from "@/components/it-forms/request-status-tracker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Laptop } from "lucide-react"

export default function NewGadgetRequestPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleFormSubmit = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Laptop className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New IT Gadget Request</h1>
          <p className="text-muted-foreground mt-1">
            Request a new IT gadget to replace faulty or outdated equipment
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
              <CardTitle>New IT Gadget Request Form</CardTitle>
              <CardDescription>
                Complete Section A. Sections B-D will be filled by IT staff and management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NewGadgetRequestForm onSubmit={handleFormSubmit} key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-requests">
          <Card>
            <CardHeader>
              <CardTitle>My Gadget Requests</CardTitle>
              <CardDescription>
                View the status of your submitted new gadget requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequestStatusTracker
                formType="new-gadget"
                title="My Gadget Requests"
                description="View your gadget requests, update drafts before review, and export them to PDF."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
