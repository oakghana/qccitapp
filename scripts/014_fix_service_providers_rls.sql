-- ============================================
-- FIX SERVICE_PROVIDERS RLS POLICIES
-- This script fixes the RLS policies for service_providers table
-- Run this after the main migrations
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "IT staff can view service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Admins can manage service providers" ON public.service_providers;
DROP POLICY IF EXISTS "All IT roles can view service providers" ON public.service_providers;
DROP POLICY IF EXISTS "IT managers can manage service providers" ON public.service_providers;

-- Create updated SELECT policy with proper role access (using ::text cast for enum compatibility)
CREATE POLICY "All IT roles can view service providers" ON public.service_providers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN (
        'admin', 'it_head', 'it_staff', 'it_store_head', 'regional_it_head',
        'service_desk_accra', 'service_desk_kumasi', 'service_desk_takoradi',
        'service_desk_tema', 'service_desk_sunyani', 'service_desk_cape_coast'
      )
    )
  );

-- Create INSERT/UPDATE/DELETE policy for admins and IT heads
CREATE POLICY "IT managers can manage service providers" ON public.service_providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN ('admin', 'it_head')
    )
  );

-- Verify the table has RLS enabled
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.service_providers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_providers TO authenticated;
