"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@/lib/auth-context"
import { canSeeAllLocations } from "@/lib/location-filter"

export interface BadgeCounts {
  assignedTasks: number
  serviceDeskTickets: number
  repairs: number
  storeRequisitions: number
  serviceProviders: number
  userAccounts: number
  itStaffStatus: number
  notifications: number
  updates: number
}

export function useBadgeCounts(user: User | null) {
  const [counts, setCounts] = useState<BadgeCounts>({
    assignedTasks: 0,
    serviceDeskTickets: 0,
    repairs: 0,
    storeRequisitions: 0,
    serviceProviders: 0,
    userAccounts: 0,
    itStaffStatus: 0,
    notifications: 0,
    updates: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCounts() {
      if (!user) {
        setLoading(false)
        return
      }

      const supabase = createClient()
      const canSeeAll = canSeeAllLocations(user)
      const userLocation = user.location

      try {
        // Fetch assigned tasks count (for IT staff)
        let tasksQuery = supabase
          .from("service_tickets")
          .select("*", { count: "exact", head: true })
          .eq("status", "in_progress")

        if (!canSeeAll && userLocation) {
          tasksQuery = tasksQuery.eq("location", userLocation)
        }
        const { count: tasksCount } = await tasksQuery

        // Fetch service desk tickets count
        let ticketsQuery = supabase
          .from("service_tickets")
          .select("*", { count: "exact", head: true })
          .eq("status", "open")

        if (!canSeeAll && userLocation) {
          ticketsQuery = ticketsQuery.eq("location", userLocation)
        }
        const { count: ticketsCount } = await ticketsQuery

        // Fetch repairs count
        let repairsQuery = supabase
          .from("repair_requests")
          .select("*", { count: "exact", head: true })
          .or("status.eq.pending,status.eq.in_progress")

        if (!canSeeAll && userLocation) {
          repairsQuery = repairsQuery.eq("requester_location", userLocation)
        }
        const { count: repairsCount } = await repairsQuery

        // Fetch store requisitions count
        let requisitionsQuery = supabase
          .from("store_requisitions")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")

        if (!canSeeAll && userLocation) {
          requisitionsQuery = requisitionsQuery.eq("location", userLocation)
        }
        const { count: requisitionsCount } = await requisitionsQuery

        // Fetch service providers count (only filter by location if user can't see all)
        let providersQuery = supabase
          .from("service_providers")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)

        if (!canSeeAll && userLocation) {
          providersQuery = providersQuery.eq("location", userLocation)
        }
        const { count: providersCount } = await providersQuery

        // Fetch user accounts pending approval (admins only)
        const { count: accountsCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")

        // Fetch IT staff count (for admins/IT heads)
        let staffQuery = supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .in("role", ["it_staff", "regional_it_head"])
          .eq("is_active", true)

        if (!canSeeAll && userLocation) {
          staffQuery = staffQuery.eq("location", userLocation)
        }
        const { count: staffCount } = await staffQuery

        // Fetch notifications count (user-specific)
        const { count: notificationsCount } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("is_read", false)
          .eq("user_id", user.id)

        setCounts({
          assignedTasks: tasksCount || 0,
          serviceDeskTickets: ticketsCount || 0,
          repairs: repairsCount || 0,
          storeRequisitions: requisitionsCount || 0,
          serviceProviders: providersCount || 0,
          userAccounts: accountsCount || 0,
          itStaffStatus: staffCount || 0,
          notifications: notificationsCount || 0,
          updates: 0,
        })
      } catch (error) {
        console.error("[v0] Error fetching badge counts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()

    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000)
    return () => clearInterval(interval)
  }, [user])

  return { counts, loading }
}
