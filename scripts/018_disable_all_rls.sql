-- ============================================
-- DISABLE ALL RLS POLICIES
-- This script completely disables RLS on all tables
-- Run this in Supabase SQL Editor
-- ============================================

-- Core tables
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.devices DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.repair_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_providers DISABLE ROW LEVEL SECURITY;

-- Location tables
ALTER TABLE IF EXISTS public.regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.districts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.locations DISABLE ROW LEVEL SECURITY;

-- Notification and tasks
ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.repair_tasks DISABLE ROW LEVEL SECURITY;

-- Requisitions
ALTER TABLE IF EXISTS public.requisitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.requisition_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.requisition_approvals DISABLE ROW LEVEL SECURITY;

-- Stock management
ALTER TABLE IF EXISTS public.stock_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.allocation_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stock_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.toner_usage DISABLE ROW LEVEL SECURITY;

-- Service ticket updates
ALTER TABLE IF EXISTS public.service_ticket_updates DISABLE ROW LEVEL SECURITY;

-- PDF related
ALTER TABLE IF EXISTS public.pdf_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pdf_confirmations DISABLE ROW LEVEL SECURITY;

-- Audit logs
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;

-- Lookup tables
ALTER TABLE IF EXISTS public.lookup_device_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lookup_item_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lookup_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lookup_departments DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'All RLS policies have been DISABLED!' AS status;
