-- ============================================================
-- DIAGNOSTIC: Check location formats in store_items and requisitions
-- ============================================================

-- Check all unique locations in store_items
SELECT 'UNIQUE LOCATIONS IN store_items:' as info;
SELECT DISTINCT location, COUNT(*) as item_count 
FROM store_items 
GROUP BY location 
ORDER BY location;

-- Check items at Head Office (all variations)
SELECT 'HEAD OFFICE ITEMS (all variations):' as info;
SELECT id, name, location, quantity, quantity_in_stock, category
FROM store_items
WHERE location ILIKE '%head%office%' 
   OR location = 'head_office' 
   OR location = 'Head Office'
ORDER BY location, name;

-- Check requisitions and their destination locations
SELECT 'RECENT REQUISITIONS WITH DESTINATIONS:' as info;
SELECT 
  id, 
  requisition_number,
  location as source_location,
  destination_location,
  status,
  created_at
FROM store_requisitions
WHERE destination_location IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check if there's a mismatch between destination_location formats
SELECT 'LOCATION FORMAT ANALYSIS:' as info;
SELECT 
  r.requisition_number,
  r.destination_location as req_destination,
  CASE 
    WHEN r.destination_location = 'head_office' THEN 'snake_case'
    WHEN r.destination_location = 'Head Office' THEN 'Title Case'
    ELSE 'other'
  END as format_type,
  (SELECT COUNT(*) FROM store_items si WHERE si.location = r.destination_location) as matching_items
FROM store_requisitions r
WHERE r.destination_location IS NOT NULL
ORDER BY r.created_at DESC
LIMIT 10;

-- Check what the assign-stock page would see for Head Office
SELECT 'ITEMS VISIBLE IN ASSIGN-STOCK FOR HEAD OFFICE (quantity > 0):' as info;
SELECT id, name, category, location, quantity
FROM store_items
WHERE (location = 'head_office' OR location = 'Head Office')
  AND quantity > 0
ORDER BY name;
