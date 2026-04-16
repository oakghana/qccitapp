"use client"

import { useEffect } from "react"
import { RealtimeChannel } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

interface RealtimeOptions {
  table: string
  filter?: string
  onUpdate?: (data: any) => void
  onInsert?: (data: any) => void
  onDelete?: (data: any) => void
}

export function useRealtimeUpdates(options: RealtimeOptions) {
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel | null = null

    const subscribe = async () => {
      try {
        channel = supabase.channel(`realtime:${options.table}:${Date.now()}`)

        channel
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: options.table,
              filter: options.filter,
            },
            (payload) => {
              console.log("[v0] Realtime UPDATE:", payload)
              options.onUpdate?.(payload.new)
            }
          )
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: options.table,
              filter: options.filter,
            },
            (payload) => {
              console.log("[v0] Realtime INSERT:", payload)
              options.onInsert?.(payload.new)
            }
          )
          .on(
            "postgres_changes",
            {
              event: "DELETE",
              schema: "public",
              table: options.table,
              filter: options.filter,
            },
            (payload) => {
              console.log("[v0] Realtime DELETE:", payload)
              options.onDelete?.(payload.old)
            }
          )
          .subscribe((status) => {
            console.log("[v0] Realtime subscription status:", status)
          })
      } catch (error) {
        console.error("[v0] Error setting up realtime subscription:", error)
      }
    }

    subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [options, supabase])
}

export function useRealtimeTable(
  table: string,
  filter?: string,
  callbacks?: {
    onUpdate?: (data: any) => void
    onInsert?: (data: any) => void
    onDelete?: (data: any) => void
  }
) {
  useRealtimeUpdates({
    table,
    filter,
    onUpdate: callbacks?.onUpdate,
    onInsert: callbacks?.onInsert,
    onDelete: callbacks?.onDelete,
  })
}
