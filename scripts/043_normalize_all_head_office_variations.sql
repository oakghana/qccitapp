-- Comprehensive normalization of ALL Head Office location variations
-- This catches any variation of "Head Office" in the devices table

-- First, let's see what location values exist for Head Office devices
SELECT DISTINCT location, COUNT(*) as device_count
FROM devices
WHERE location ILIKE '%head%' OR location ILIKE '%office%'
GROUP BY location
ORDER BY device_count DESC;

-- Now update ALL variations to the standard 'head_office' format
UPDATE devices 
SET location = 'head_office'
WHERE 
  -- Exact matches
  location IN ('Head Office', 'head_office', 'HEAD_OFFICE', 'HEAD OFFICE', 'head office')
  -- Pattern matches
  OR LOWER(location) LIKE '%head%office%'
  OR LOWER(REPLACE(location, ' ', '')) LIKE '%headoffice%'
  OR LOWER(REPLACE(location, '_', '')) LIKE '%headoffice%'
  OR LOWER(REPLACE(REPLACE(location, ' ', ''), '_', '')) = 'headoffice';

-- Update other tables too
UPDATE profiles 
SET location = 'head_office'
WHERE 
  location IN ('Head Office', 'head_office', 'HEAD_OFFICE', 'HEAD OFFICE', 'head office')
  OR LOWER(location) LIKE '%head%office%'
  OR LOWER(REPLACE(location, ' ', '')) LIKE '%headoffice%'
  OR LOWER(REPLACE(location, '_', '')) LIKE '%headoffice%'
  OR LOWER(REPLACE(REPLACE(location, ' ', ''), '_', '')) = 'headoffice';

UPDATE store_items 
SET location = 'head_office'
WHERE 
  location IN ('Head Office', 'head_office', 'HEAD_OFFICE', 'HEAD OFFICE', 'head office')
  OR LOWER(location) LIKE '%head%office%'
  OR LOWER(REPLACE(location, ' ', '')) LIKE '%headoffice%'
  OR LOWER(REPLACE(location, '_', '')) LIKE '%headoffice%'
  OR LOWER(REPLACE(REPLACE(location, ' ', ''), '_', '')) = 'headoffice';

UPDATE stock_transfer_requests 
SET requesting_location = 'head_office'
WHERE 
  requesting_location IN ('Head Office', 'head_office', 'HEAD_OFFICE', 'HEAD OFFICE', 'head office')
  OR LOWER(requesting_location) LIKE '%head%office%'
  OR LOWER(REPLACE(requesting_location, ' ', '')) LIKE '%headoffice%'
  OR LOWER(REPLACE(requesting_location, '_', '')) LIKE '%headoffice%'
  OR LOWER(REPLACE(REPLACE(requesting_location, ' ', ''), '_', '')) = 'headoffice';

UPDATE stock_transactions 
SET location_name = 'head_office'
WHERE 
  location_name IN ('Head Office', 'head_office', 'HEAD_OFFICE', 'HEAD OFFICE', 'head office')
  OR LOWER(location_name) LIKE '%head%office%'
  OR LOWER(REPLACE(location_name, ' ', '')) LIKE '%headoffice%'
  OR LOWER(REPLACE(location_name, '_', '')) LIKE '%headoffice%'
  OR LOWER(REPLACE(REPLACE(location_name, ' ', ''), '_', '')) = 'headoffice';

-- Show final summary
SELECT 
  'Devices with head_office location:' as description,
  COUNT(*) as count
FROM devices 
WHERE location = 'head_office'

UNION ALL

SELECT 
  'Profiles with head_office location:' as description,
  COUNT(*) as count
FROM profiles 
WHERE location = 'head_office'

UNION ALL

SELECT 
  'Store items with head_office location:' as description,
  COUNT(*) as count
FROM store_items 
WHERE location = 'head_office';
