-- ============================================================
-- FIX: Check and fix RLS policies for stock_assignments table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Check if RLS is enabled
SELECT 'RLS STATUS:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'stock_assignments';

-- Check existing policies
SELECT 'EXISTING POLICIES:' as info;
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'stock_assignments';

-- Option 1: Disable RLS for stock_assignments (simplest fix)
ALTER TABLE stock_assignments DISABLE ROW LEVEL SECURITY;

-- OR Option 2: Create permissive policies if you want to keep RLS
-- Uncomment these if you prefer to keep RLS enabled:
/*
ALTER TABLE stock_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on stock_assignments" ON stock_assignments;
CREATE POLICY "Allow all operations on stock_assignments" ON stock_assignments
  FOR ALL
  USING (true)
  WITH CHECK (true);
*/

-- Verify RLS is disabled
SELECT 'AFTER FIX - RLS STATUS:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'stock_assignments';

-- Test insert
SELECT 'Testing insert capability...' as info;
