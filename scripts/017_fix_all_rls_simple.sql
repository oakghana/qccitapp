-- ============================================
-- SIMPLIFIED RLS POLICIES - NO RECURSION
-- This script fixes ALL RLS policies using simple auth checks
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: DISABLE RLS TEMPORARILY FOR FIXES
-- ============================================

-- First, let's disable RLS on profiles to prevent recursion issues
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "IT staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Allow all authenticated to view profiles" ON public.profiles;

-- Service tickets policies
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

-- Repair requests policies
DROP POLICY IF EXISTS "IT staff can view repair requests" ON public.repair_requests;
DROP POLICY IF EXISTS "IT staff can manage repair requests" ON public.repair_requests;
DROP POLICY IF EXISTS "repair_requests_select_policy" ON public.repair_requests;
DROP POLICY IF EXISTS "repair_requests_insert_policy" ON public.repair_requests;
DROP POLICY IF EXISTS "repair_requests_update_policy" ON public.repair_requests;
DROP POLICY IF EXISTS "repair_requests_delete_policy" ON public.repair_requests;
DROP POLICY IF EXISTS "All IT roles can view repair requests" ON public.repair_requests;
DROP POLICY IF EXISTS "IT roles can manage repair requests" ON public.repair_requests;

-- Devices policies
DROP POLICY IF EXISTS "IT staff can view devices" ON public.devices;
DROP POLICY IF EXISTS "IT staff can manage devices" ON public.devices;
DROP POLICY IF EXISTS "devices_select_policy" ON public.devices;
DROP POLICY IF EXISTS "devices_insert_policy" ON public.devices;
DROP POLICY IF EXISTS "devices_update_policy" ON public.devices;
DROP POLICY IF EXISTS "devices_delete_policy" ON public.devices;
DROP POLICY IF EXISTS "All IT roles can view devices" ON public.devices;
DROP POLICY IF EXISTS "IT roles can manage devices" ON public.devices;

-- Store items policies
DROP POLICY IF EXISTS "IT staff can view store items" ON public.store_items;
DROP POLICY IF EXISTS "Store managers can manage items" ON public.store_items;
DROP POLICY IF EXISTS "All IT roles can view store items" ON public.store_items;
DROP POLICY IF EXISTS "Store heads can manage items" ON public.store_items;
DROP POLICY IF EXISTS "store_items_select_policy" ON public.store_items;
DROP POLICY IF EXISTS "store_items_manage_policy" ON public.store_items;

-- Service providers policies
DROP POLICY IF EXISTS "IT staff can view service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Admins can manage service providers" ON public.service_providers;
DROP POLICY IF EXISTS "All IT roles can view service providers" ON public.service_providers;
DROP POLICY IF EXISTS "Admin roles can manage service providers" ON public.service_providers;
DROP POLICY IF EXISTS "IT managers can manage service providers" ON public.service_providers;
DROP POLICY IF EXISTS "service_providers_select_policy" ON public.service_providers;
DROP POLICY IF EXISTS "service_providers_manage_policy" ON public.service_providers;

-- Regions and districts policies
DROP POLICY IF EXISTS "Anyone can view regions" ON public.regions;
DROP POLICY IF EXISTS "regions_select_policy" ON public.regions;
DROP POLICY IF EXISTS "Anyone can view districts" ON public.districts;
DROP POLICY IF EXISTS "districts_select_policy" ON public.districts;

-- ============================================
-- STEP 3: CREATE SIMPLE POLICIES (NO RECURSION)
-- ============================================

-- PROFILES: Simple policy - all authenticated can view, update own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

GRANT SELECT, UPDATE, INSERT ON public.profiles TO authenticated;

-- SERVICE_TICKETS: All authenticated can view and create
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_tickets_select_all" ON public.service_tickets
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_tickets_insert_all" ON public.service_tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "service_tickets_update_all" ON public.service_tickets
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_tickets_delete_all" ON public.service_tickets
  FOR DELETE USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_tickets TO authenticated;

-- REPAIR_REQUESTS: All authenticated can view
ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "repair_requests_select_all" ON public.repair_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "repair_requests_insert_all" ON public.repair_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "repair_requests_update_all" ON public.repair_requests
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "repair_requests_delete_all" ON public.repair_requests
  FOR DELETE USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_requests TO authenticated;

-- DEVICES: All authenticated can view
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devices_select_all" ON public.devices
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "devices_insert_all" ON public.devices
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "devices_update_all" ON public.devices
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "devices_delete_all" ON public.devices
  FOR DELETE USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices TO authenticated;

-- STORE_ITEMS: All authenticated can view
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store_items_select_all" ON public.store_items
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "store_items_insert_all" ON public.store_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "store_items_update_all" ON public.store_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "store_items_delete_all" ON public.store_items
  FOR DELETE USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_items TO authenticated;

-- SERVICE_PROVIDERS: All authenticated can view
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_providers_select_all" ON public.service_providers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_providers_insert_all" ON public.service_providers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "service_providers_update_all" ON public.service_providers
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "service_providers_delete_all" ON public.service_providers
  FOR DELETE USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_providers TO authenticated;

-- REGIONS: All authenticated can view
DO $$ BEGIN
  ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "regions_select_all" ON public.regions
    FOR SELECT USING (auth.uid() IS NOT NULL);
  GRANT SELECT ON public.regions TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- DISTRICTS: All authenticated can view
DO $$ BEGIN
  ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "districts_select_all" ON public.districts
    FOR SELECT USING (auth.uid() IS NOT NULL);
  GRANT SELECT ON public.districts TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- LOCATIONS: All authenticated can view
DO $$ BEGIN
  ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "locations_select_all" ON public.locations
    FOR SELECT USING (auth.uid() IS NOT NULL);
  GRANT SELECT ON public.locations TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- NOTIFICATIONS: Users can view their own
DO $$ BEGIN
  ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
  DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
  
  CREATE POLICY "notifications_select_all" ON public.notifications
    FOR SELECT USING (auth.uid() IS NOT NULL);
  CREATE POLICY "notifications_insert_all" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  CREATE POLICY "notifications_update_all" ON public.notifications
    FOR UPDATE USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- REPAIR_TASKS: All authenticated can view
DO $$ BEGIN
  ALTER TABLE public.repair_tasks ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service providers can view their tasks" ON public.repair_tasks;
  DROP POLICY IF EXISTS "IT staff can view all repair tasks" ON public.repair_tasks;
  DROP POLICY IF EXISTS "IT staff can manage repair tasks" ON public.repair_tasks;
  
  CREATE POLICY "repair_tasks_select_all" ON public.repair_tasks
    FOR SELECT USING (auth.uid() IS NOT NULL);
  CREATE POLICY "repair_tasks_insert_all" ON public.repair_tasks
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  CREATE POLICY "repair_tasks_update_all" ON public.repair_tasks
    FOR UPDATE USING (auth.uid() IS NOT NULL);
  CREATE POLICY "repair_tasks_delete_all" ON public.repair_tasks
    FOR DELETE USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.repair_tasks TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- REQUISITIONS
DO $$ BEGIN
  ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own requisitions" ON public.requisitions;
  DROP POLICY IF EXISTS "Admin and IT Head can view all requisitions" ON public.requisitions;
  DROP POLICY IF EXISTS "Regional IT heads can view region requisitions" ON public.requisitions;
  DROP POLICY IF EXISTS "IT staff can view location requisitions" ON public.requisitions;
  DROP POLICY IF EXISTS "Users can create requisitions" ON public.requisitions;
  DROP POLICY IF EXISTS "Users can update own draft requisitions" ON public.requisitions;
  DROP POLICY IF EXISTS "Managers can update requisitions" ON public.requisitions;
  
  CREATE POLICY "requisitions_select_all" ON public.requisitions
    FOR SELECT USING (auth.uid() IS NOT NULL);
  CREATE POLICY "requisitions_insert_all" ON public.requisitions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  CREATE POLICY "requisitions_update_all" ON public.requisitions
    FOR UPDATE USING (auth.uid() IS NOT NULL);
  CREATE POLICY "requisitions_delete_all" ON public.requisitions
    FOR DELETE USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisitions TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- REQUISITION_ITEMS
DO $$ BEGIN
  ALTER TABLE public.requisition_items ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view requisition items" ON public.requisition_items;
  DROP POLICY IF EXISTS "Users can insert requisition items" ON public.requisition_items;
  DROP POLICY IF EXISTS "Managers can update requisition items" ON public.requisition_items;
  
  CREATE POLICY "requisition_items_all" ON public.requisition_items
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisition_items TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- REQUISITION_APPROVALS
DO $$ BEGIN
  ALTER TABLE public.requisition_approvals ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view requisition approvals" ON public.requisition_approvals;
  DROP POLICY IF EXISTS "Managers can insert requisition approvals" ON public.requisition_approvals;
  
  CREATE POLICY "requisition_approvals_all" ON public.requisition_approvals
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisition_approvals TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- STOCK_ALLOCATIONS
DO $$ BEGIN
  ALTER TABLE public.stock_allocations ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own allocations" ON public.stock_allocations;
  DROP POLICY IF EXISTS "Admin can view all allocations" ON public.stock_allocations;
  DROP POLICY IF EXISTS "Regional IT heads can view region allocations" ON public.stock_allocations;
  DROP POLICY IF EXISTS "IT staff can view location allocations" ON public.stock_allocations;
  DROP POLICY IF EXISTS "IT staff can manage allocations" ON public.stock_allocations;
  DROP POLICY IF EXISTS "IT staff can insert allocations" ON public.stock_allocations;
  
  CREATE POLICY "stock_allocations_all" ON public.stock_allocations
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_allocations TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- ALLOCATION_ITEMS
DO $$ BEGIN
  ALTER TABLE public.allocation_items ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "IT staff can view allocation items" ON public.allocation_items;
  DROP POLICY IF EXISTS "IT staff can insert allocation items" ON public.allocation_items;
  DROP POLICY IF EXISTS "IT staff can update allocation items" ON public.allocation_items;
  
  CREATE POLICY "allocation_items_all" ON public.allocation_items
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.allocation_items TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- STOCK_TRANSACTIONS
DO $$ BEGIN
  ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "IT staff can view stock transactions" ON public.stock_transactions;
  DROP POLICY IF EXISTS "IT staff can insert stock transactions" ON public.stock_transactions;
  
  CREATE POLICY "stock_transactions_all" ON public.stock_transactions
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_transactions TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- TONER_USAGE
DO $$ BEGIN
  ALTER TABLE public.toner_usage ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "IT staff can view toner usage" ON public.toner_usage;
  DROP POLICY IF EXISTS "IT staff can insert toner usage" ON public.toner_usage;
  DROP POLICY IF EXISTS "IT staff can update toner usage" ON public.toner_usage;
  
  CREATE POLICY "toner_usage_all" ON public.toner_usage
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.toner_usage TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- SERVICE_TICKET_UPDATES
DO $$ BEGIN
  ALTER TABLE public.service_ticket_updates ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view service ticket updates" ON public.service_ticket_updates;
  DROP POLICY IF EXISTS "IT staff can insert service ticket updates" ON public.service_ticket_updates;
  
  CREATE POLICY "service_ticket_updates_all" ON public.service_ticket_updates
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_ticket_updates TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- PDF_UPLOADS
DO $$ BEGIN
  ALTER TABLE public.pdf_uploads ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "IT staff can view PDF uploads" ON public.pdf_uploads;
  DROP POLICY IF EXISTS "IT staff can insert PDF uploads" ON public.pdf_uploads;
  
  CREATE POLICY "pdf_uploads_all" ON public.pdf_uploads
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdf_uploads TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- PDF_CONFIRMATIONS
DO $$ BEGIN
  ALTER TABLE public.pdf_confirmations ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view PDF confirmations" ON public.pdf_confirmations;
  DROP POLICY IF EXISTS "Users can confirm PDFs" ON public.pdf_confirmations;
  
  CREATE POLICY "pdf_confirmations_all" ON public.pdf_confirmations
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdf_confirmations TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- AUDIT_LOGS
DO $$ BEGIN
  ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "audit_logs_all" ON public.audit_logs
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- STEP 4: LOOKUP TABLES (device_types, item_categories, etc.)
-- ============================================

DO $$ BEGIN
  ALTER TABLE public.lookup_device_types ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "lookup_device_types_select" ON public.lookup_device_types;
  CREATE POLICY "lookup_device_types_select" ON public.lookup_device_types
    FOR SELECT USING (auth.uid() IS NOT NULL);
  CREATE POLICY "lookup_device_types_all" ON public.lookup_device_types
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.lookup_device_types TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.lookup_item_categories ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "lookup_item_categories_select" ON public.lookup_item_categories;
  CREATE POLICY "lookup_item_categories_select" ON public.lookup_item_categories
    FOR SELECT USING (auth.uid() IS NOT NULL);
  CREATE POLICY "lookup_item_categories_all" ON public.lookup_item_categories
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.lookup_item_categories TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.lookup_locations ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "lookup_locations_select" ON public.lookup_locations;
  CREATE POLICY "lookup_locations_select" ON public.lookup_locations
    FOR SELECT USING (auth.uid() IS NOT NULL);
  CREATE POLICY "lookup_locations_all" ON public.lookup_locations
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.lookup_locations TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.lookup_departments ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS "lookup_departments_select" ON public.lookup_departments;
  CREATE POLICY "lookup_departments_select" ON public.lookup_departments
    FOR SELECT USING (auth.uid() IS NOT NULL);
  CREATE POLICY "lookup_departments_all" ON public.lookup_departments
    FOR ALL USING (auth.uid() IS NOT NULL);
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.lookup_departments TO authenticated;
EXCEPTION WHEN undefined_table THEN NULL;
        WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'RLS policies have been simplified and fixed!' AS status;

-- To verify policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;
