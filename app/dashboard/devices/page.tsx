"use client"

import { DeviceInventory } from "@/components/devices/device-inventory"
import { DuplicateDeviceChecker } from "@/components/devices/duplicate-device-checker"
import { useAuth } from "@/lib/auth-context"

export default function DevicesPage() {
  const { user } = useAuth()
  const canSeeDuplicates =
    user?.role === "admin" || user?.role === "regional_it_head" || user?.role === "it_head"

  return (
    <div className="space-y-6">
      <DeviceInventory />
      {canSeeDuplicates && <DuplicateDeviceChecker />}
    </div>
  )
}
