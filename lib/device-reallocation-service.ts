'use server'

import { createClient } from "@supabase/supabase-js"

/**
 * Device Reallocation Service
 * Handles bulk reallocation of devices to new locations
 */
export const deviceReallocationService = {
  /**
   * Reallocate a single device to a new location
   */
  async reallocateDevice(
    deviceId: string,
    newLocation: string,
    userId?: string
  ): Promise<{ success: boolean; message: string; device?: any }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Update device
      const { data, error } = await supabase
        .from("devices")
        .update({
          location: newLocation,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deviceId)
        .select()
        .single()

      if (error) {
        console.error("[v0] Error reallocating device:", error)
        return {
          success: false,
          message: `Failed to reallocate device: ${error.message}`,
        }
      }

      // Log the change
      console.log("[v0] Device reallocated:", {
        deviceId,
        newLocation,
        changedBy: userId,
        timestamp: new Date().toISOString(),
      })

      return {
        success: true,
        message: "Device reallocated successfully",
        device: data,
      }
    } catch (error: any) {
      console.error("[v0] Error in reallocateDevice:", error)
      return {
        success: false,
        message: `Error: ${error.message}`,
      }
    }
  },

  /**
   * Reallocate multiple devices to a new location
   */
  async reallocateMultipleDevices(
    deviceIds: string[],
    newLocation: string,
    userId?: string
  ): Promise<{ success: boolean; message: string; reallocated: number; failed: number }> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      let reallocated = 0
      let failed = 0

      for (const deviceId of deviceIds) {
        const { error } = await supabase
          .from("devices")
          .update({
            location: newLocation,
            updated_at: new Date().toISOString(),
          })
          .eq("id", deviceId)

        if (error) {
          console.error("[v0] Error reallocating device:", deviceId, error)
          failed++
        } else {
          reallocated++
        }
      }

      // Log the bulk change
      console.log("[v0] Bulk device reallocation completed:", {
        totalDevices: deviceIds.length,
        reallocated,
        failed,
        newLocation,
        changedBy: userId,
        timestamp: new Date().toISOString(),
      })

      return {
        success: failed === 0,
        message:
          failed === 0
            ? `All ${reallocated} devices reallocated successfully`
            : `${reallocated} devices reallocated, ${failed} failed`,
        reallocated,
        failed,
      }
    } catch (error: any) {
      console.error("[v0] Error in reallocateMultipleDevices:", error)
      return {
        success: false,
        message: `Error: ${error.message}`,
        reallocated: 0,
        failed: deviceIds.length,
      }
    }
  },

  /**
   * Get available locations for reallocation
   */
  async getAvailableLocations(): Promise<Array<{ code: string; name: string }>> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data, error } = await supabase
        .from("locations")
        .select("code, name")
        .eq("is_active", true)
        .order("name", { ascending: true })

      if (error) {
        console.error("[v0] Error fetching locations:", error)
        return []
      }

      return data || []
    } catch (error: any) {
      console.error("[v0] Error in getAvailableLocations:", error)
      return []
    }
  },
}
