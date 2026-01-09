"use client"

import type { User } from "./auth-context"

/**
 * Determines if a user can see all locations
 * Only Admin and IT Head at Head Office have access to all locations
 * Regional IT heads and other users are restricted to their specific location
 */
export function canSeeAllLocations(user: User | null): boolean {
  if (!user) return false
  if (user.role === "admin") return true
  if (user.role === "it_head" && user.location === "Head Office") return true
  if (user.role === "it_staff" && user.location === "Head Office") return true
  return false
}

/**
 * Determines if a user can assign tasks and manage regional staff
 * Regional IT heads have this permission for their location only
 */
export function canManageRegionalStaff(user: User | null): boolean {
  if (!user) return false
  return user.role === "admin" || user.role === "it_head" || user.role === "regional_it_head"
}

/**
 * Gets the location filter for queries
 * Returns null if user can see all locations, otherwise returns their location
 * Users, regional IT heads, and non-Head Office staff can only see their location data
 */
export function getLocationFilter(user: User | null): string | null {
  if (!user) return null
  if (canSeeAllLocations(user)) return null
  return user.location || null
}

/**
 * Applies location filter to a Supabase query
 * Only filters if user cannot see all locations
 * Regional IT heads and regular users will have their location filter applied
 */
export function applyLocationFilter<T>(query: T, user: User | null, columnName = "location"): T {
  const locationFilter = getLocationFilter(user)
  if (locationFilter) {
    // @ts-ignore - Dynamic query building
    return query.eq(columnName, locationFilter)
  }
  return query
}

/**
 * Checks if a user can edit data for a specific location
 * Admin and Head Office IT staff can edit all locations
 * Regional IT heads and other users can only edit their own location's data
 */
export function canEditLocation(user: User | null, location: string): boolean {
  if (!user) return false
  if (canSeeAllLocations(user)) return true
  return user.location === location
}

/**
 * Checks if a user can view data for a specific location
 * Admin and Head Office IT staff can view all locations
 * Regional IT heads and other users can only view their own location's data
 */
export function canViewLocation(user: User | null, location: string): boolean {
  if (!user) return false
  if (canSeeAllLocations(user)) return true
  return user.location === location
}

/**
 * Checks if a user can create IT repair tasks
 * Only IT staff and Admin at Head Office can create repairs
 * Regional IT heads and other staff can only view repairs
 */
export function canCreateRepairs(user: User | null): boolean {
  if (!user) return false
  if (user.role === "admin") return true
  if (user.role === "it_staff" && user.location === "Head Office") return true
  if (user.role === "it_head" && user.location === "Head Office") return true
  if (user.role === "it_store_head" && user.location === "Head Office") return true
  return false
}

/**
 * Checks if a user can edit/delete stock items
 * Admin and IT Store Head can edit/delete all stock
 * IT Head at Head Office can also manage stock
 */
export function canManageStock(user: User | null): boolean {
  if (!user) return false
  if (user.role === "admin") return true
  if (user.role === "it_store_head") return true
  if (user.role === "it_head" && user.location === "Head Office") return true
  return false
}

/**
 * Checks if a user can assign items to users in their location
 * Regional IT heads can assign items in their location
 */
export function canAssignItems(user: User | null): boolean {
  if (!user) return false
  if (user.role === "admin") return true
  if (user.role === "it_head") return true
  if (user.role === "regional_it_head") return true
  if (user.role === "it_store_head") return true
  return false
}
