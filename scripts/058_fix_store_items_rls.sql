-- ============================================================
-- FIX: Disable RLS on store_items table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Check RLS status on store_items
SELECT 'store_items RLS STATUS:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'store_items';

-- Disable RLS on store_items
ALTER TABLE store_items DISABLE ROW LEVEL SECURITY;

-- Also check and disable RLS on related tables
ALTER TABLE stock_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE devices DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 'AFTER FIX - All tables RLS status:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('store_items', 'stock_assignments', 'stock_transactions', 'devices')
ORDER BY tablename;
