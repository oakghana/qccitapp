import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type AuditAction = 
  | "document_uploaded" 
  | "document_deleted" 
  | "document_restored"
  | "document_confirmed"
  | "document_viewed"

export interface AuditLogEntry {
  id?: string
  document_id: string
  action: AuditAction
  user_id: string
  user_name: string
  user_email?: string
  user_role?: string
  created_at?: string
  details?: Record<string, any>
  ip_address?: string
}

/**
 * Log a document audit action
 */
export async function logDocumentAudit(
  entry: AuditLogEntry
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString()
    
    const { error } = await supabase
      .from("document_audit_logs")
      .insert({
        document_id: entry.document_id,
        action: entry.action,
        user_id: entry.user_id,
        user_name: entry.user_name,
        user_email: entry.user_email || null,
        user_role: entry.user_role || null,
        created_at: now,
        details: entry.details || null,
        ip_address: entry.ip_address || null,
      })

    if (error) {
      console.error("[v0] Error logging document audit:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Exception in logDocumentAudit:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Get audit trail for a specific document
 */
export async function getDocumentAuditTrail(
  documentId: string
): Promise<AuditLogEntry[] | null> {
  try {
    const { data, error } = await supabase
      .from("document_audit_logs")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching document audit trail:", error)
      return null
    }

    return data as AuditLogEntry[]
  } catch (error) {
    console.error("[v0] Exception in getDocumentAuditTrail:", error)
    return null
  }
}

/**
 * Get all audit logs with optional filtering
 */
export async function getAllAuditLogs(filters?: {
  action?: AuditAction
  userId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}): Promise<{
  logs: AuditLogEntry[] | null
  total: number
}> {
  try {
    let query = supabase
      .from("document_audit_logs")
      .select("*", { count: "exact" })

    if (filters?.action) {
      query = query.eq("action", filters.action)
    }

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId)
    }

    if (filters?.startDate) {
      query = query.gte("created_at", filters.startDate)
    }

    if (filters?.endDate) {
      query = query.lte("created_at", filters.endDate)
    }

    query = query.order("created_at", { ascending: false })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("[v0] Error fetching all audit logs:", error)
      return { logs: null, total: 0 }
    }

    return { logs: data as AuditLogEntry[], total: count || 0 }
  } catch (error) {
    console.error("[v0] Exception in getAllAuditLogs:", error)
    return { logs: null, total: 0 }
  }
}

/**
 * Get deletion history (who deleted documents and when)
 */
export async function getDeletionHistory(
  limit: number = 50
): Promise<AuditLogEntry[] | null> {
  try {
    const { data, error } = await supabase
      .from("document_audit_logs")
      .select("*")
      .eq("action", "document_deleted")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[v0] Error fetching deletion history:", error)
      return null
    }

    return data as AuditLogEntry[]
  } catch (error) {
    console.error("[v0] Exception in getDeletionHistory:", error)
    return null
  }
}

/**
 * Get user activity for a specific user
 */
export async function getUserDocumentActivity(
  userId: string,
  limit: number = 100
): Promise<AuditLogEntry[] | null> {
  try {
    const { data, error } = await supabase
      .from("document_audit_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("[v0] Error fetching user activity:", error)
      return null
    }

    return data as AuditLogEntry[]
  } catch (error) {
    console.error("[v0] Exception in getUserDocumentActivity:", error)
    return null
  }
}
