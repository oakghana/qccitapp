import { createClient } from "@supabase/supabase-js"

/**
 * Creates a Supabase admin client safely.
 * Returns null if environment variables are not available (e.g., during build).
 */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    // During build, env vars might not be available
    if (process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV) {
      return null
    }
    throw new Error("Supabase environment variables are not set")
  }

  return createClient(url, serviceKey)
}

/**
 * Checks if Supabase is available (for build-time safety).
 */
export function isSupabaseAvailable(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}
