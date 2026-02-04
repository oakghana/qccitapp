-- ============================================================
-- DIAGNOSTIC AND FIX SCRIPT FOR STOCK LOCATION ISSUES
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Check what location values exist for HP COLOUR LASERJET 3303
SELECT 
  id, 
  name, 
  location, 
  quantity, 
  quantity_in_stock,
  sku,
  created_at
FROM store_items 
WHERE name ILIKE '%HP COLOUR LASERJET%' OR name ILIKE '%HP%LASERJET%3303%'
ORDER BY location, name;

-- Step 2: Check ALL distinct location values in store_items
SELECT DISTINCT location, COUNT(*) as item_count
FROM store_items
GROUP BY location
ORDER BY location;

-- Step 3: Check if there are items at 'central_stores' vs 'Central Stores'
SELECT 
  location,
  COUNT(*) as count,
  SUM(quantity) as total_quantity
FROM store_items
WHERE location ILIKE '%central%' OR location ILIKE '%store%'
GROUP BY location;

-- Step 4: STANDARDIZE ALL LOCATION VALUES TO 'Central Stores'
-- This will fix the mismatch between 'central_stores' and 'Central Stores'
UPDATE store_items 
SET location = 'Central Stores'
WHERE location ILIKE 'central%store%' 
   OR location = 'central_stores'
   OR location = 'Central_Stores'
   OR location = 'central stores';

-- Step 5: Verify the HP COLOUR LASERJET 3303 quantity after fix
SELECT 
  id, 
  name, 
  location, 
  quantity, 
  quantity_in_stock,
  sku
FROM store_items 
WHERE name ILIKE '%HP COLOUR LASERJET%' OR name ILIKE '%HP%LASERJET%3303%';

-- Step 6: If there are duplicate items at the same location, merge them
-- First, identify duplicates
SELECT 
  name, 
  location,
  COUNT(*) as duplicate_count,
  SUM(quantity) as total_quantity
FROM store_items
WHERE location = 'Central Stores'
GROUP BY name, location
HAVING COUNT(*) > 1;

-- Step 7: Check the requisition that's being issued
SELECT 
  id,
  requisition_number,
  status,
  location,
  destination_location,
  items,
  created_at
FROM store_requisitions
WHERE status IN ('approved', 'pending', 'issued')
ORDER BY created_at DESC
LIMIT 10;

-- Step 8: Check stock transactions to see what happened to the stock
SELECT 
  st.id,
  st.item_name,
  st.transaction_type,
  st.quantity,
  st.location_name,
  st.recipient,
  st.created_at
FROM stock_transactions st
WHERE st.item_name ILIKE '%HP COLOUR LASERJET%' OR st.item_name ILIKE '%LASERJET%3303%'
ORDER BY st.created_at DESC
LIMIT 20;

-- Step 9: Show final summary
SELECT 'STOCK SUMMARY AFTER FIXES' as info;

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
WHERE name ILIKE '%HP%LASERJET%' OR name ILIKE '%HP COLOUR%'
ORDER BY name, location;
