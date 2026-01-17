-- ============================================
-- FIX STORE_ITEMS RLS POLICIES
-- This script fixes the RLS policies for store_items table
-- The issue is role comparison without ::text cast for enum types
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "IT staff can view store items" ON public.store_items;
DROP POLICY IF EXISTS "Store managers can manage items" ON public.store_items;
DROP POLICY IF EXISTS "All IT roles can view store items" ON public.store_items;
DROP POLICY IF EXISTS "Store heads can manage items" ON public.store_items;

-- Create updated SELECT policy with proper role access (using ::text cast for enum compatibility)
CREATE POLICY "All IT roles can view store items" ON public.store_items
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

-- Create INSERT/UPDATE/DELETE policy for store managers
CREATE POLICY "Store heads can manage items" ON public.store_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN ('admin', 'it_store_head', 'it_head')
    )
  );

-- Verify the table has RLS enabled
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON public.store_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.store_items TO authenticated;

-- ============================================
-- Also add the regional_it_head role to view items
-- ============================================
