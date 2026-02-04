-- ============================================================
-- FIX: Reset HP COLOUR LASERJET quantity and check stock levels
-- Run this in Supabase SQL Editor
-- ============================================================

-- Check current state of the item
SELECT 'CURRENT STATE OF HP LASERJET:' as info;
SELECT id, name, quantity, quantity_in_stock, location
FROM store_items
WHERE name ILIKE '%HP%LASERJET%';

-- The quantity is -1 which means it was over-assigned
-- Reset it to 1 (the item was requisitioned but assignment failed)
UPDATE store_items 
SET 
  quantity = 1,
  quantity_in_stock = 1,
  updated_at = NOW()
WHERE name ILIKE '%HP%LASERJET%' AND location = 'Head Office';

-- Also fix the Central Stores item to 0 (it was transferred out)
UPDATE store_items 
SET 
  quantity = 0,
  quantity_in_stock = 0,
  updated_at = NOW()
WHERE name ILIKE '%HP%LASERJET%' AND location = 'Central Stores';

-- Verify fix
SELECT 'AFTER FIX:' as info;
SELECT id, name, quantity, quantity_in_stock, location
FROM store_items
WHERE name ILIKE '%HP%LASERJET%';

-- Check all items with negative quantities
SELECT 'ITEMS WITH NEGATIVE QUANTITIES:' as info;
SELECT id, name, quantity, quantity_in_stock, location
FROM store_items
WHERE quantity < 0 OR quantity_in_stock < 0
ORDER BY name;

-- Fix any items with negative quantities (set to 0)
UPDATE store_items 
SET 
  quantity = 0,
  quantity_in_stock = 0
WHERE quantity < 0 OR quantity_in_stock < 0;

-- Sync quantity fields
UPDATE store_items 
SET quantity_in_stock = quantity
WHERE quantity_in_stock != quantity;

-- Clean up any duplicate failed stock assignment records
-- Keep only the most recent one
WITH duplicates AS (
  SELECT id, item_name, assigned_to, created_at,
         ROW_NUMBER() OVER (PARTITION BY item_name, assigned_to ORDER BY created_at DESC) as rn
  FROM stock_assignments
  WHERE item_name ILIKE '%HP%LASERJET%'
)
DELETE FROM stock_assignments
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

SELECT 'CLEANUP COMPLETE' as info;
