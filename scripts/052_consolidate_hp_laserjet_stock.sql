-- ============================================================
-- FIX SCRIPT: Consolidate HP COLOUR LASERJET 3303 stock
-- Run this in Supabase SQL Editor
-- ============================================================

-- First, let's see the current state
SELECT 'BEFORE FIX:' as info;
SELECT id, name, location, quantity, quantity_in_stock, sku
FROM store_items 
WHERE name ILIKE '%HP COLOUR LASERJET 3303%';

-- Option 1: Move the head_office stock back to Central Stores
-- Update the Central Stores record to have the combined quantity
UPDATE store_items 
SET 
  quantity = quantity + 1,
  quantity_in_stock = quantity_in_stock + 1,
  updated_at = NOW()
WHERE name = 'HP COLOUR LASERJET 3303' 
  AND location = 'Central Stores';

-- Delete the head_office duplicate record
DELETE FROM store_items 
WHERE name = 'HP COLOUR LASERJET 3303' 
  AND location = 'head_office';

-- Verify the fix
SELECT 'AFTER FIX:' as info;
SELECT id, name, location, quantity, quantity_in_stock, sku
FROM store_items 
WHERE name ILIKE '%HP COLOUR LASERJET 3303%';

-- Also standardize head_office location if there are other items there
UPDATE store_items 
SET location = 'Head Office'
WHERE location = 'head_office';

-- Show all HP items now
SELECT 
  name,
  location,
  quantity,
  quantity_in_stock,
  CASE 
    WHEN quantity <= 0 THEN 'OUT OF STOCK'
    WHEN quantity < 5 THEN 'LOW STOCK'
    ELSE 'IN STOCK'
  END as status
FROM store_items
WHERE name ILIKE '%HP%'
ORDER BY name, location;
