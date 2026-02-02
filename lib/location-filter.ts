"use client"

import type { User } from "./auth-context"

/**
 * Normalizes location string for case-insensitive comparison
 */
export function normalizeLocation(location: string | null | undefined): string {
  if (!location) return ""
  // Convert to lowercase and handle common variations
  return location.toLowerCase().replace(/[\s_-]+/g, "_").trim()
}

/**
 * Case-insensitive location comparison
 */
export function locationsMatch(loc1: string | null | undefined, loc2: string | null | undefined): boolean {
  if (!loc1 || !loc2) return false
  return normalizeLocation(loc1) === normalizeLocation(loc2)
}

/**
 * Determines if a user can see all locations
 * Only Admin and IT Head at Head Office have access to all locations
 * Regional IT heads and other users are restricted to their specific location
 */
export function canSeeAllLocations(userOrRole: User | string | null): boolean {
  if (!userOrRole) return false
  
  // Handle case where just a role string is passed
  if (typeof userOrRole === "string") {
    return userOrRole === "admin" || userOrRole === "it_head" || userOrRole === "it_store_head"
  }
  
  // Handle full User object
  const user = userOrRole
  if (user.role === "admin") return true
  if (user.role === "it_head") return true
  if (user.role === "it_store_head") return true
  if (user.role === "it_staff" && locationsMatch(user.location, "head_office")) return true
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
 * PLUS Central Stores items which are visible to all IT staff
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
 * BUT will also see Central Stores items which are shared across all locations
 */
export function applyLocationFilter<T>(query: T, user: User | null, columnName = "location"): T {
  const locationFilter = getLocationFilter(user)
  if (locationFilter) {
    // @ts-ignore - Dynamic query building
    return query.or(`${columnName}.eq.${locationFilter},${columnName}.eq.Central Stores`)
  }
  return query
}

/**
 * Checks if a user can view data for a specific location
 * Admin and Head Office IT staff can view all locations
 * Regional IT heads and other users can view their own location's data
 * PLUS Central Stores items which are visible to everyone
 */
export function canViewLocation(user: User | null, location: string): boolean {
  if (!user) return false
  if (canSeeAllLocations(user)) return true
  if (location === "Central Stores") return true
  return user.location === location
}

/**
 * Checks if a user can edit data for a specific location
 * Admin and Head Office IT staff can edit all locations
 * Regional IT heads can edit their own location's data
 * Other users can only edit their own location's data
 */
export function canEditLocation(user: User | null, location: string): boolean {
  if (!user) return false
  if (canSeeAllLocations(user)) return true
  // Regional IT heads can edit their location's data
  if (user.role === "regional_it_head" && user.location === location) return true
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
 * Regional IT Heads can manage stock in their location
 */
export function canManageStock(user: User | null): boolean {
  if (!user) return false
  if (user.role === "admin") return true
  if (user.role === "it_store_head") return true
  if (user.role === "it_head" && user.location === "Head Office") return true
  if (user.role === "regional_it_head") return true
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

/**
 * Checks if a user can view stock balance reports
 * All IT staff roles can view stock reports, except regular users
 */
export function canViewStockReports(user: User | null): boolean {
  if (!user) return false
  const allowedRoles = ["admin", "it_head", "regional_it_head", "it_staff", "it_store_head"]
  return allowedRoles.includes(user.role)
}
