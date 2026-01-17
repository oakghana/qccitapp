import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Badge count configuration registry - defines what each menu item counts
const BADGE_CONFIG: Record<string, {
  table: string
  countType: 'filtered' | 'total' | 'custom'
  filters?: Record<string, any>
  statusIn?: string[]
  customQuery?: string
  locationField?: string
  description: string
}> = {
  // Service Desk - Open/New tickets
  serviceDeskTickets: {
    table: 'service_tickets',
    countType: 'filtered',
    statusIn: ['open', 'Open', 'new', 'New', 'in_triage', 'In Triage'],
    locationField: 'location',
    description: 'Open service desk tickets'
  },
  // Repairs - Pending and In Progress
  repairs: {
    table: 'repair_requests',
    countType: 'filtered',
    statusIn: ['pending', 'in_progress', 'in_repair', 'In Repair'],
    locationField: 'location',
    description: 'Active repair requests'
  },
  // Devices - Total active devices
  devices: {
    table: 'devices',
    countType: 'filtered',
    statusIn: ['active', 'in_service', 'Active'],
    locationField: 'location',
    description: 'Active devices'
  },
  // Store Requisitions - Pending approval
  storeRequisitions: {
    table: 'requisitions',
    countType: 'filtered',
    statusIn: ['pending', 'submitted', 'pending_approval', 'Pending', 'Submitted'],
    locationField: 'location',
    description: 'Pending requisitions'
  },
  // Stock Allocations - Allocated or In Transit
  stockAllocations: {
    table: 'stock_allocations',
    countType: 'filtered',
    statusIn: ['allocated', 'in_transit', 'Allocated', 'In Transit'],
    locationField: 'location',
    description: 'Active allocations'
  },
  // Low Stock Items
  lowStockItems: {
    table: 'store_items',
    countType: 'custom',
    locationField: 'location',
    description: 'Low stock items (quantity <= reorder level)'
  },
  // Service Providers - Active providers
  serviceProviders: {
    table: 'service_providers',
    countType: 'filtered',
    filters: { is_active: true },
    locationField: 'location',
    description: 'Active service providers'
  },
  // IT Staff Status - Active IT staff
  itStaffStatus: {
    table: 'profiles',
    countType: 'custom',
    locationField: 'location',
    description: 'Active IT staff members'
  },
  // Pending User Approvals
  pendingUserApprovals: {
    table: 'profiles',
    countType: 'filtered',
    statusIn: ['pending'],
    locationField: 'location',
    description: 'Users pending approval'
  },
  // Assigned Tasks - In progress tickets assigned
  assignedTasks: {
    table: 'service_tickets',
    countType: 'filtered',
    statusIn: ['in_progress', 'In Progress'],
    locationField: 'location',
    description: 'Tasks in progress'
  },
  // Ready for Pickup
  readyForPickup: {
    table: 'repair_requests',
    countType: 'filtered',
    statusIn: ['ready_for_pickup', 'Ready for Pickup', 'completed'],
    locationField: 'location',
    description: 'Repairs ready for pickup'
  },
  // Notifications - Unread
  notifications: {
    table: 'notifications',
    countType: 'custom',
    description: 'Unread notifications'
  },
  // User Accounts - Total users
  userAccounts: {
    table: 'profiles',
    countType: 'total',
    locationField: 'location',
    description: 'Total user accounts'
  },
}

// Helper to apply location filter
function applyLocationFilter(query: any, location: string, canSeeAll: boolean, field: string = 'location') {
  if (!canSeeAll && location) {
    // Use flexible matching for location
    return query.or(`${field}.ilike.${location},${field}.ilike.%${location}%`)
  }
  return query
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get("location") || ""
    const canSeeAll = searchParams.get("canSeeAll") === "true"
    const userId = searchParams.get("userId") || ""
    const userRole = searchParams.get("userRole") || ""
    const region = searchParams.get("region") || ""
    const district = searchParams.get("district") || ""

    console.log("[v0] API Badge Counts - location:", location, "canSeeAll:", canSeeAll, "role:", userRole)

    const counts: Record<string, number> = {}

    // Process each badge configuration
    for (const [key, config] of Object.entries(BADGE_CONFIG)) {
      try {
        let count = 0

        if (config.countType === 'custom') {
          // Handle custom queries
          count = await handleCustomQuery(key, config, { location, canSeeAll, userId, userRole, region, district })
        } else {
          // Standard query building
          let query = supabaseAdmin
            .from(config.table)
            .select("*", { count: "exact", head: true })

          // Apply status filters
          if (config.statusIn && config.statusIn.length > 0) {
            const statusConditions = config.statusIn.map(s => `status.eq.${s}`).join(',')
            query = query.or(statusConditions)
          }

          // Apply additional filters
          if (config.filters) {
            for (const [field, value] of Object.entries(config.filters)) {
              query = query.eq(field, value)
            }
          }

          // Apply location filter
          if (config.locationField) {
            query = applyLocationFilter(query, location, canSeeAll, config.locationField)
          }

          const { count: resultCount, error } = await query
          
          if (error) {
            console.error(`[v0] Error fetching ${key} count:`, error.message)
            counts[key] = -1 // Use -1 to indicate error (will show as dash)
          } else {
            count = resultCount || 0
          }
        }

        counts[key] = count
      } catch (e) {
        console.error(`[v0] Exception fetching ${key} count:`, e)
        counts[key] = -1
      }
    }

    console.log("[v0] Badge counts result:", counts)

    return NextResponse.json(counts)
  } catch (error) {
    console.error("[v0] API Badge Counts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Handle custom queries that need special logic
async function handleCustomQuery(
  key: string, 
  config: typeof BADGE_CONFIG[string],
  params: { location: string; canSeeAll: boolean; userId: string; userRole: string; region: string; district: string }
): Promise<number> {
  const { location, canSeeAll, userId, userRole, region, district } = params

  switch (key) {
    case 'lowStockItems': {
      // Items where quantity <= reorder_level
      let query = supabaseAdmin
        .from('store_items')
        .select('id, quantity, reorder_level', { count: 'exact' })
      
      query = applyLocationFilter(query, location, canSeeAll, 'location')
      
      const { data, error } = await query
      if (error) return -1
      
      // Filter in code since we can't do column comparison in Supabase easily
      const lowStock = (data || []).filter((item: any) => 
        item.quantity <= (item.reorder_level || 0)
      )
      return lowStock.length
    }

    case 'itStaffStatus': {
      // Count IT staff members
      let query = supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('role', ['it_staff', 'regional_it_head', 'it_head', 'admin'])
      
      query = applyLocationFilter(query, location, canSeeAll, 'location')
      
      const { count, error } = await query
      return error ? -1 : (count || 0)
    }

    case 'notifications': {
      // Unread notifications for current user
      if (!userId) return 0
      
      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      
      return error ? -1 : (count || 0)
    }

    default:
      return 0
  }
}

