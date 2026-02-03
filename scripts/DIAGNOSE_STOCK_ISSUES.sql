-- Database Diagnostic Script
-- Run this in Supabase SQL Editor to check current stock status

-- 1. Check total store_items
SELECT 
  location,
  COUNT(*) as total_items,
  SUM(quantity) as total_quantity,
  SUM(CASE WHEN quantity > 0 THEN 1 ELSE 0 END) as items_in_stock,
  SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
  SUM(CASE WHEN quantity < reorder_level THEN 1 ELSE 0 END) as low_stock
FROM store_items
GROUP BY location
ORDER BY location;

-- 2. Check all Head Office items
SELECT 
  id,
  name,
  category,
  quantity,
  reorder_level,
  unit,
  location,
  created_at
FROM store_items
WHERE location LIKE '%Head%Office%' OR location = 'Head Office'
ORDER BY name;

-- 3. Check if stock_transactions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'stock_transactions'
) as stock_transactions_exists;

-- 4. Check store_requisitions status
SELECT 
  status,
  COUNT(*) as count,
  SUM((SELECT COUNT(*) FROM jsonb_array_elements(items))) as total_items
FROM store_requisitions
GROUP BY status;

-- 5. Check recent requisitions
SELECT 
  requisition_number,
  status,
  location,
  requested_by,
  created_at,
  items
FROM store_requisitions
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check devices table
SELECT 
  location,
  status,
  COUNT(*) as device_count
FROM devices
GROUP BY location, status
ORDER BY location, status;
