/**
 * Authorization helpers for QCC IT App
 * Centralizes role-based access control logic
 */

// Define all roles in the system
export type Role = 
  | 'admin'
  | 'it_head'
  | 'it_store_head'
  | 'regional_it_head'
  | 'it_staff'
  | 'service_desk_head'
  | 'service_desk_staff'
  | 'staff'
  | 'user';

// Role display names for UI
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  'admin': 'Admin',
  'it_head': 'IT Head',
  'it_store_head': 'IT Store Head',
  'regional_it_head': 'Regional IT Head',
  'it_staff': 'IT Staff',
  'service_desk_head': 'Service Desk Head',
  'service_desk_staff': 'Service Desk Staff',
  'staff': 'Staff',
  'user': 'User',
};

/**
 * Check if a user can create stock requisitions
 * Only Admin and IT Store Head are allowed
 */
export function canCreateRequisition(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return normalizedRole === 'admin' || normalizedRole === 'it_store_head';
}

/**
 * Check if a user can approve requisitions
 * Admin, IT Head, IT Store Head can approve
 */
export function canApproveRequisition(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return ['admin', 'it_head', 'it_store_head'].includes(normalizedRole);
}

/**
 * Check if a user can issue requisitions (deduct stock)
 * Admin, IT Store Head can issue
 */
export function canIssueRequisition(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return ['admin', 'it_store_head'].includes(normalizedRole);
}

/**
 * Check if a user can add items to inventory
 * Admin, IT Head, IT Store Head can add items
 */
export function canAddInventoryItems(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return ['admin', 'it_head', 'it_store_head'].includes(normalizedRole);
}

/**
 * Check if a user can manage stock transfers
 * Admin, IT Head, IT Store Head, Regional IT Head
 */
export function canManageStockTransfers(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return ['admin', 'it_head', 'it_store_head', 'regional_it_head'].includes(normalizedRole);
}

/**
 * Check if a user can view all locations' data
 */
export function canViewAllLocations(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return ['admin', 'it_head', 'it_store_head', 'service_desk_head'].includes(normalizedRole);
}

/**
 * Check if a user can assign tickets
 */
export function canAssignTickets(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return ['admin', 'it_head', 'regional_it_head', 'service_desk_head'].includes(normalizedRole);
}

/**
 * Check if a user can delete records (admin override)
 */
export function canDeleteRecords(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return normalizedRole === 'admin';
}

/**
 * Check if a user can assign IT devices to staff
 * Admin and IT Store Head can assign devices
 */
export function canAssignDevices(role?: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  return ['admin', 'it_store_head'].includes(normalizedRole);
}

/**
 * Log authorization failure for audit
 */
export function logAuthzFailure(
  userId: string | undefined,
  userRole: string | undefined,
  action: string,
  resource: string
): void {
  console.warn(`[AUTHZ_DENIED] User: ${userId || 'unknown'}, Role: ${userRole || 'none'}, Action: ${action}, Resource: ${resource}, Time: ${new Date().toISOString()}`);
}
