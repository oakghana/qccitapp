"use client"

import type { User } from "./auth-context"

/**
 * Determines if a user can see all locations
 * Admin and it_head roles have access to all locations
 * Regional IT heads can manage their specific region
 */
export function canSeeAllLocations(user: User | null): boolean {
  if (!user) return false
  return user.role === "admin" || user.role === "it_head"
}

/**
 * Determines if a user can assign tasks and manage regional staff
 * Regional IT heads have this permission for their location
 */
export function canManageRegionalStaff(user: User | null): boolean {
  if (!user) return false
  return user.role === "admin" || user.role === "it_head" || user.role === "regional_it_head"
}

/**
 * Gets the location filter for queries
 * Returns null if user can see all locations, otherwise returns their location
 */
export function getLocationFilter(user: User | null): string | null {
  if (!user) return null
  if (canSeeAllLocations(user)) return null
  return user.location || null
}

/**
 * Applies location filter to a Supabase query
 * Only filters if user cannot see all locations
 */
export function applyLocationFilter<T>(query: T, user: User | null, columnName = "location"): T {
  const locationFilter = getLocationFilter(user)
  if (locationFilter) {
    // @ts-ignore - Dynamic query building
    return query.eq(columnName, locationFilter)
  }
  return query
}
