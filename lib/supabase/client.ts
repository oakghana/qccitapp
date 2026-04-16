import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key-placeholder"

export function createClient() {
  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
}

export function createBrowserClient() {
  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
}
