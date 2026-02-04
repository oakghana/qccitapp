-- ============================================================
-- FIX: Add missing columns to stock_assignments table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Show current table structure
SELECT 'CURRENT stock_assignments COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stock_assignments'
ORDER BY ordinal_position;

-- Add missing columns
DO $$
BEGIN
  -- assigned_to_email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'assigned_to_email') THEN
    ALTER TABLE stock_assignments ADD COLUMN assigned_to_email TEXT;
    RAISE NOTICE 'Added column: assigned_to_email';
  END IF;

  -- department
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'department') THEN
    ALTER TABLE stock_assignments ADD COLUMN department TEXT;
    RAISE NOTICE 'Added column: department';
  END IF;

  -- office_location
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'office_location') THEN
    ALTER TABLE stock_assignments ADD COLUMN office_location TEXT;
    RAISE NOTICE 'Added column: office_location';
  END IF;

  -- room_number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'room_number') THEN
    ALTER TABLE stock_assignments ADD COLUMN room_number TEXT;
    RAISE NOTICE 'Added column: room_number';
  END IF;

  -- assigned_by_role
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'assigned_by_role') THEN
    ALTER TABLE stock_assignments ADD COLUMN assigned_by_role TEXT;
    RAISE NOTICE 'Added column: assigned_by_role';
  END IF;

  -- requisition_number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'requisition_number') THEN
    ALTER TABLE stock_assignments ADD COLUMN requisition_number TEXT;
    RAISE NOTICE 'Added column: requisition_number';
  END IF;

  -- is_replacement
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'is_replacement') THEN
    ALTER TABLE stock_assignments ADD COLUMN is_replacement BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added column: is_replacement';
  END IF;

  -- replacement_reason
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'replacement_reason') THEN
    ALTER TABLE stock_assignments ADD COLUMN replacement_reason TEXT;
    RAISE NOTICE 'Added column: replacement_reason';
  END IF;

  -- is_hardware
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'is_hardware') THEN
    ALTER TABLE stock_assignments ADD COLUMN is_hardware BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added column: is_hardware';
  END IF;

  -- devices_created
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_assignments' AND column_name = 'devices_created') THEN
    ALTER TABLE stock_assignments ADD COLUMN devices_created INTEGER DEFAULT 0;
    RAISE NOTICE 'Added column: devices_created';
  END IF;
END $$;

-- Verify the fix
SELECT 'AFTER FIX - stock_assignments COLUMNS:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stock_assignments'
ORDER BY ordinal_position;
