import { createClient } from "@/lib/supabase/client"

export interface DuplicateDevice {
  id: string
  serial_number: string
  brand: string
  model: string
  location: string
  status: string
  created_at: string
}

export interface DeviceWithoutLocation {
  id: string
  serial_number: string
  brand: string
  model: string
  device_type: string
  status: string
  created_at: string
}

/**
 * Device Location Validation Service
 * Handles duplicate location detection and location validation
 */
export const deviceLocationService = {
  /**
   * Check if a device with the same serial number exists at the specified location
   */
  async checkDuplicateLocation(
    serialNumber: string,
    location: string,
    excludeDeviceId?: string
  ): Promise<DuplicateDevice | null> {
    try {
      const supabase = createClient()
      
      let query = supabase
        .from("devices")
        .select("*")
        .eq("serial_number", serialNumber)
        .eq("location", location)

      if (excludeDeviceId) {
        query = query.neq("id", excludeDeviceId)
      }

      const { data, error } = await query.single()

      if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
        console.error("[v0] Error checking duplicate location:", error)
        return null
      }

      return data || null
    } catch (error) {
      console.error("[v0] Error in checkDuplicateLocation:", error)
      return null
    }
  },

  /**
   * Get all devices without a location
   */
  async getDevicesWithoutLocation(): Promise<DeviceWithoutLocation[]> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .or("location.is.null,location.eq.")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching devices without location:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("[v0] Error in getDevicesWithoutLocation:", error)
      return []
    }
  },

  /**
   * Get devices without location count
   */
  async getDevicesWithoutLocationCount(): Promise<number> {
    try {
      const supabase = createClient()

      const { count, error } = await supabase
        .from("devices")
        .select("*", { count: "exact", head: true })
        .or("location.is.null,location.eq.")

      if (error) {
        console.error("[v0] Error counting devices without location:", error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error("[v0] Error in getDevicesWithoutLocationCount:", error)
      return 0
    }
  },

  /**
   * Validate location string is not empty
   */
  isValidLocation(location: string | null | undefined): boolean {
    return location !== null && location !== undefined && location.trim() !== ""
  },

  /**
   * Get location statistics
   */
  async getLocationStatistics(): Promise<Record<string, number>> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("devices")
        .select("location", { count: "exact" })

      if (error) {
        console.error("[v0] Error fetching location stats:", error)
        return {}
      }

      const stats: Record<string, number> = {}
      
      if (data) {
        data.forEach((item: any) => {
          const location = item.location || "Unallocated"
          stats[location] = (stats[location] || 0) + 1
        })
      }

      return stats
    } catch (error) {
      console.error("[v0] Error in getLocationStatistics:", error)
      return {}
    }
  },

  /**
   * Validate serial number format (basic validation)
   */
  isValidSerialNumber(serialNumber: string): boolean {
    return serialNumber && serialNumber.trim().length > 0
  },

  /**
   * Check if device exists (any location)
   */
  async deviceExists(serialNumber: string): Promise<boolean> {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("devices")
        .select("id", { count: "exact", head: true })
        .eq("serial_number", serialNumber)

      if (error) {
        console.error("[v0] Error checking device exists:", error)
        return false
      }

      return (data?.length || 0) > 0
    } catch (error) {
      console.error("[v0] Error in deviceExists:", error)
      return false
    }
  },
}
