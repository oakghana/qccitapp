-- Normalize all Head Office location variations to a consistent format
-- This fixes the issue where devices are stored with "head_office", "Head Office", etc.

-- Update devices table - normalize all Head Office variations
UPDATE devices 
SET location = 'head_office'
WHERE LOWER(REPLACE(location, ' ', '_')) = 'head_office'
  OR location ILIKE 'head office'
  OR location ILIKE 'head_office'
  OR location = 'Head Office';

-- Update profiles table - normalize all Head Office variations
UPDATE profiles 
SET location = 'head_office'
WHERE LOWER(REPLACE(location, ' ', '_')) = 'head_office'
  OR location ILIKE 'head office'
  OR location ILIKE 'head_office'
  OR location = 'Head Office';

-- Update store_items table - normalize all Head Office variations
UPDATE store_items 
SET location = 'head_office'
WHERE LOWER(REPLACE(location, ' ', '_')) = 'head_office'
  OR location ILIKE 'head office'
  OR location ILIKE 'head_office'
  OR location = 'Head Office';

-- Update stock_transfer_requests table - normalize requesting_location
UPDATE stock_transfer_requests 
SET requesting_location = 'head_office'
WHERE LOWER(REPLACE(requesting_location, ' ', '_')) = 'head_office'
  OR requesting_location ILIKE 'head office'
  OR requesting_location ILIKE 'head_office'
  OR requesting_location = 'Head Office';

-- Update stock_transactions table - normalize location_name
UPDATE stock_transactions 
SET location_name = 'head_office'
WHERE LOWER(REPLACE(location_name, ' ', '_')) = 'head_office'
  OR location_name ILIKE 'head office'
  OR location_name ILIKE 'head_office'
  OR location_name = 'Head Office';

-- Note: service_desk table does not exist, skipping normalization

-- Show summary of changes
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
WHERE location = 'head_office';
