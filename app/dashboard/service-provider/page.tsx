"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ServiceProviderDashboard } from "@/components/service-provider/service-provider-dashboard"
import { HardwareServiceProviderDashboard } from "@/components/service-provider/hardware-service-provider-dashboard"

export default function ServiceProviderPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Service Provider Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage repair tasks and track device repairs</p>
      </div>

      <Tabs defaultValue="repairs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="repairs">Repair Tasks</TabsTrigger>
          <TabsTrigger value="devices-for-repair">Devices for Repair</TabsTrigger>
        </TabsList>

        <TabsContent value="repairs" className="space-y-4">
          <ServiceProviderDashboard />
        </TabsContent>

        <TabsContent value="devices-for-repair" className="space-y-4">
          <HardwareServiceProviderDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}

