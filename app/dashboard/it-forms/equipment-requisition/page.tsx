"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ITEquipmentRequisitionForm } from "@/components/it-forms/equipment-requisition-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ITEquipmentRequisitionPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleFormSubmit = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">IT Equipment Requisition</h1>
        <p className="text-muted-foreground mt-2">
          Request computer consumables and gadgets from the IT Store
        </p>
      </div>

      <Tabs defaultValue="new-request" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-request">New Request</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="new-request" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>New IT Equipment Requisition</CardTitle>
              <CardDescription>
                Complete the form below to request computer consumables or gadgets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ITEquipmentRequisitionForm onSubmit={handleFormSubmit} key={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-requests">
          <Card>
            <CardHeader>
              <CardTitle>My Requisition Requests</CardTitle>
              <CardDescription>
                View the status of your submitted IT equipment requisitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Requisition tracking coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
