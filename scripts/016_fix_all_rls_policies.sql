-- ============================================
-- FIX ALL RLS POLICIES FOR KEY TABLES
-- This script fixes RLS policies for all critical tables
-- The issue is role comparison without ::text cast for enum types
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: FIX SERVICE_TICKETS RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.service_tickets;
DROP POLICY IF EXISTS "IT staff can view all tickets" ON public.service_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.service_tickets;
DROP POLICY IF EXISTS "IT staff can update tickets" ON public.service_tickets;
DROP POLICY IF EXISTS "service_tickets_select_policy" ON public.service_tickets;
DROP POLICY IF EXISTS "service_tickets_insert_policy" ON public.service_tickets;
DROP POLICY IF EXISTS "service_tickets_update_policy" ON public.service_tickets;
DROP POLICY IF EXISTS "service_tickets_delete_policy" ON public.service_tickets;
DROP POLICY IF EXISTS "All authenticated can view service tickets" ON public.service_tickets;
DROP POLICY IF EXISTS "IT roles can manage service tickets" ON public.service_tickets;

-- Enable RLS
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;

-- SELECT: All authenticated users can view tickets (own or location-based for IT)
CREATE POLICY "service_tickets_select_policy" ON public.service_tickets
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Users can see their own tickets
      requested_by = (SELECT full_name FROM public.profiles WHERE id = auth.uid()) OR
      requested_by = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR
      -- IT roles can see tickets based on their access level
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role::text IN (
          'admin', 'it_head', 'it_staff', 'it_store_head', 'regional_it_head',
          'service_desk_accra', 'service_desk_kumasi', 'service_desk_takoradi',
          'service_desk_tema', 'service_desk_sunyani', 'service_desk_cape_coast'
        )
      )
    )
  );

-- INSERT: All authenticated users can create tickets
CREATE POLICY "service_tickets_insert_policy" ON public.service_tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: IT roles can update tickets
CREATE POLICY "service_tickets_update_policy" ON public.service_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN (
        'admin', 'it_head', 'it_staff', 'it_store_head', 'regional_it_head',
        'service_desk_accra', 'service_desk_kumasi', 'service_desk_takoradi',
        'service_desk_tema', 'service_desk_sunyani', 'service_desk_cape_coast'
      )
    )
  );

-- DELETE: Only admins can delete tickets
CREATE POLICY "service_tickets_delete_policy" ON public.service_tickets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.service_tickets TO authenticated;
GRANT DELETE ON public.service_tickets TO authenticated;

-- ============================================
-- PART 2: FIX REPAIR_REQUESTS RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "IT staff can view repair requests" ON public.repair_requests;
DROP POLICY IF EXISTS "IT staff can manage repair requests" ON public.repair_requests;
DROP POLICY IF EXISTS "repair_requests_select_policy" ON public.repair_requests;
DROP POLICY IF EXISTS "repair_requests_insert_policy" ON public.repair_requests;
DROP POLICY IF EXISTS "repair_requests_update_policy" ON public.repair_requests;
DROP POLICY IF EXISTS "repair_requests_delete_policy" ON public.repair_requests;
DROP POLICY IF EXISTS "All IT roles can view repair requests" ON public.repair_requests;
DROP POLICY IF EXISTS "IT roles can manage repair requests" ON public.repair_requests;

-- Enable RLS
ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: IT roles can view repair requests
CREATE POLICY "repair_requests_select_policy" ON public.repair_requests
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

-- INSERT: IT roles can create repair requests
CREATE POLICY "repair_requests_insert_policy" ON public.repair_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN (
        'admin', 'it_head', 'it_staff', 'it_store_head', 'regional_it_head',
        'service_desk_accra', 'service_desk_kumasi', 'service_desk_takoradi',
        'service_desk_tema', 'service_desk_sunyani', 'service_desk_cape_coast'
      )
    )
  );

-- UPDATE: IT roles can update repair requests
CREATE POLICY "repair_requests_update_policy" ON public.repair_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN (
        'admin', 'it_head', 'it_staff', 'it_store_head', 'regional_it_head',
        'service_desk_accra', 'service_desk_kumasi', 'service_desk_takoradi',
        'service_desk_tema', 'service_desk_sunyani', 'service_desk_cape_coast'
      )
    )
  );

-- DELETE: Only admins and IT heads can delete
CREATE POLICY "repair_requests_delete_policy" ON public.repair_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN ('admin', 'it_head')
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_requests TO authenticated;

-- ============================================
-- PART 3: FIX DEVICES RLS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "IT staff can view devices" ON public.devices;
DROP POLICY IF EXISTS "IT staff can manage devices" ON public.devices;
DROP POLICY IF EXISTS "devices_select_policy" ON public.devices;
DROP POLICY IF EXISTS "devices_insert_policy" ON public.devices;
DROP POLICY IF EXISTS "devices_update_policy" ON public.devices;
DROP POLICY IF EXISTS "devices_delete_policy" ON public.devices;
DROP POLICY IF EXISTS "All IT roles can view devices" ON public.devices;
DROP POLICY IF EXISTS "IT roles can manage devices" ON public.devices;

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- SELECT: IT roles can view devices
CREATE POLICY "devices_select_policy" ON public.devices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN (
        'admin', 'it_head', 'it_staff', 'it_store_head', 'regional_it_head',
        'service_desk_accra', 'service_desk_kumasi', 'service_desk_takoradi',
        'service_desk_tema', 'service_desk_sunyani', 'service_desk_cape_coast',
        'user', 'staff'
      )
    )
  );

-- INSERT: IT roles can add devices
CREATE POLICY "devices_insert_policy" ON public.devices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN (
        'admin', 'it_head', 'it_staff', 'it_store_head', 'regional_it_head'
      )
    )
  );

-- UPDATE: IT roles can update devices
CREATE POLICY "devices_update_policy" ON public.devices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN (
        'admin', 'it_head', 'it_staff', 'it_store_head', 'regional_it_head'
      )
    )
  );

-- DELETE: Only admins can delete devices
CREATE POLICY "devices_delete_policy" ON public.devices
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON public.devices TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.devices TO authenticated;

-- ============================================
-- PART 4: FIX STORE_ITEMS RLS (if not already fixed)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "IT staff can view store items" ON public.store_items;
DROP POLICY IF EXISTS "Store managers can manage items" ON public.store_items;
DROP POLICY IF EXISTS "All IT roles can view store items" ON public.store_items;
DROP POLICY IF EXISTS "Store heads can manage items" ON public.store_items;
DROP POLICY IF EXISTS "store_items_select_policy" ON public.store_items;
DROP POLICY IF EXISTS "store_items_manage_policy" ON public.store_items;

-- Enable RLS
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

-- SELECT: IT roles can view store items
CREATE POLICY "store_items_select_policy" ON public.store_items
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

-- ALL: Store heads and admins can manage items
CREATE POLICY "store_items_manage_policy" ON public.store_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN ('admin', 'it_store_head', 'it_head')
    )
  );

-- Grant permissions
GRANT SELECT ON public.store_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.store_items TO authenticated;

-- ============================================
-- PART 5: FIX SERVICE_PROVIDERS RLS (if not already fixed)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "IT staff can view service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Admins can manage service providers" ON public.service_providers;
DROP POLICY IF EXISTS "All IT roles can view service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Admin roles can manage service providers" ON public.service_providers;
DROP POLICY IF EXISTS "service_providers_select_policy" ON public.service_providers;
DROP POLICY IF EXISTS "service_providers_manage_policy" ON public.service_providers;

-- Enable RLS
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- SELECT: IT roles can view service providers
CREATE POLICY "service_providers_select_policy" ON public.service_providers
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

-- ALL: Admins and IT heads can manage service providers
CREATE POLICY "service_providers_manage_policy" ON public.service_providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role::text IN ('admin', 'it_head')
    )
  );

-- Grant permissions
GRANT SELECT ON public.service_providers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_providers TO authenticated;

-- ============================================
-- PART 6: FIX PROFILES RLS (for user lookups)
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "IT staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own profile, IT roles can view all
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role::text IN (
        'admin', 'it_head', 'it_staff', 'it_store_head', 'regional_it_head',
        'service_desk_accra', 'service_desk_kumasi', 'service_desk_takoradi',
        'service_desk_tema', 'service_desk_sunyani', 'service_desk_cape_coast'
      )
    )
  );

-- UPDATE: Users can update their own profile, admins can update all
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role::text = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- ============================================
-- PART 7: FIX REGIONS AND DISTRICTS RLS
-- ============================================

-- Regions
DROP POLICY IF EXISTS "Anyone can view regions" ON public.regions;
DROP POLICY IF EXISTS "regions_select_policy" ON public.regions;

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regions_select_policy" ON public.regions
  FOR SELECT USING (auth.uid() IS NOT NULL);

GRANT SELECT ON public.regions TO authenticated;

-- Districts
DROP POLICY IF EXISTS "Anyone can view districts" ON public.districts;
DROP POLICY IF EXISTS "districts_select_policy" ON public.districts;

ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "districts_select_policy" ON public.districts
  FOR SELECT USING (auth.uid() IS NOT NULL);

GRANT SELECT ON public.districts TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the policies are created:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

SELECT 'RLS policies have been updated for all critical tables' AS status;
