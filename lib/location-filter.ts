"use client"

import type { User } from "./auth-context"

/**
 * Determines if a user can see all locations
 * Only admin and it_head roles have access to all locations
 */
export function canSeeAllLocations(user: User | null): boolean {
  if (!user) return false
  return user.role === "admin" || user.role === "it_head"
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
