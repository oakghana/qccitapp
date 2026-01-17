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
          tasksQuery = tasksQuery.ilike("location", userLocation)
        }
        const { count: tasksCount } = await tasksQuery

        // Fetch service desk tickets count
        let ticketsQuery = supabase
          .from("service_tickets")
          .select("*", { count: "exact", head: true })
          .eq("status", "open")

        if (!canSeeAll && userLocation) {
          ticketsQuery = ticketsQuery.ilike("location", userLocation)
        }
        const { count: ticketsCount } = await ticketsQuery

        let repairsCount = 0
        try {
          // For IT roles, try to fetch all repairs
          if (
            user.role === "admin" ||
            user.role === "it_head" ||
            user.role === "regional_it_head" ||
            user.role === "it_staff"
          ) {
            // Query pending repairs
            let pendingQuery = supabase
              .from("repair_requests")
              .select("*", { count: "exact", head: true })
              .eq("status", "pending")

            if (!canSeeAll && userLocation) {
              pendingQuery = pendingQuery.ilike("requester_location", userLocation)
            }
            const { count: pendingCount, error: pendingError } = await pendingQuery

            // Query in_progress repairs
            let inProgressQuery = supabase
              .from("repair_requests")
              .select("*", { count: "exact", head: true })
              .eq("status", "in_progress")

            if (!canSeeAll && userLocation) {
              inProgressQuery = inProgressQuery.ilike("requester_location", userLocation)
            }
            const { count: inProgressCount, error: inProgressError } = await inProgressQuery

            if (!pendingError && !inProgressError) {
              repairsCount = (pendingCount || 0) + (inProgressCount || 0)
            }
          } else {
            // For regular users, only show their own repairs
            const { count: userRepairsCount } = await supabase
              .from("repair_requests")
              .select("*", { count: "exact", head: true })
              .eq("requested_by", user.username)
              .in("status", ["pending", "in_progress"])

            repairsCount = userRepairsCount || 0
          }
        } catch (repairError) {
          console.error("[v0] Error fetching repairs count:", repairError)
          repairsCount = 0
        }

        // Fetch store requisitions count
        let requisitionsQuery = supabase
          .from("store_requisitions")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")

        if (!canSeeAll && userLocation) {
          requisitionsQuery = requisitionsQuery.ilike("location", userLocation)
        }
        const { count: requisitionsCount } = await requisitionsQuery

        // Fetch service providers count (only filter by location if user can't see all)
        let providersQuery = supabase
          .from("service_providers")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)

        if (!canSeeAll && userLocation) {
          providersQuery = providersQuery.ilike("location", userLocation)
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
          staffQuery = staffQuery.ilike("location", userLocation)
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
          repairs: repairsCount,
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
