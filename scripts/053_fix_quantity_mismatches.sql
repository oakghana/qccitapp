-- ============================================================
-- FIX SCRIPT: Sync quantity and quantity_in_stock fields
-- Run this in Supabase SQL Editor
-- ============================================================

-- First, show items with mismatched quantities
SELECT 'ITEMS WITH QUANTITY MISMATCH:' as info;
SELECT 
  id, 
  name, 
  location, 
  quantity, 
  quantity_in_stock,
  CASE 
    WHEN quantity != quantity_in_stock THEN 'MISMATCH'
    ELSE 'OK'
  END as status
FROM store_items
WHERE quantity != quantity_in_stock OR quantity_in_stock IS NULL
ORDER BY name;

-- Fix: Set quantity_in_stock to match quantity (quantity is the source of truth)
UPDATE store_items 
SET quantity_in_stock = quantity
WHERE quantity != quantity_in_stock OR quantity_in_stock IS NULL;

-- Verify the fix
SELECT 'AFTER FIX - All items should now have matching quantities:' as info;
SELECT 
  name, 
  location, 
  quantity, 
  quantity_in_stock,
  CASE 
    WHEN quantity = quantity_in_stock THEN 'OK'
    ELSE 'STILL MISMATCH'
  END as status
FROM store_items
WHERE name ILIKE '%HP%'
ORDER BY name;

-- Show summary of all Central Stores inventory
SELECT 'CENTRAL STORES INVENTORY SUMMARY:' as info;
SELECT 
  name,
  quantity as stock,
  CASE 
    WHEN quantity <= 0 THEN '🔴 OUT OF STOCK'
    WHEN quantity < 5 THEN '🟡 LOW STOCK'
    ELSE '🟢 IN STOCK'
  END as status
FROM store_items
WHERE location = 'Central Stores'
ORDER BY name;
