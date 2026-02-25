-- Merge "Head Office - Accra" and "Head Office" locations into a single "Head Office" location
-- This consolidates all devices, toners, and tickets from these locations

-- Step 1: Find all variations of Head Office and update them
UPDATE devices 
SET location = 'Head Office'
WHERE location IN ('Head Office - Accra', 'head office - accra', 'HEAD OFFICE - ACCRA', 'Head Office-Accra')
AND location != 'Head Office';

UPDATE service_tickets 
SET location = 'Head Office'
WHERE location IN ('Head Office - Accra', 'head office - accra', 'HEAD OFFICE - ACCRA', 'Head Office-Accra')
AND location != 'Head Office';

UPDATE store_items 
SET location = 'Head Office'
WHERE location IN ('Head Office - Accra', 'head office - accra', 'HEAD OFFICE - ACCRA', 'Head Office-Accra')
AND location != 'Head Office';

UPDATE profiles 
SET location = 'Head Office'
WHERE location IN ('Head Office - Accra', 'head office - accra', 'HEAD OFFICE - ACCRA', 'Head Office-Accra')
AND location != 'Head Office';

UPDATE repair_requests 
SET location = 'Head Office'
WHERE location IN ('Head Office - Accra', 'head office - accra', 'HEAD OFFICE - ACCRA', 'Head Office-Accra')
AND location != 'Head Office';

UPDATE repair_tasks 
SET location = 'Head Office'
WHERE location IN ('Head Office - Accra', 'head office - accra', 'HEAD OFFICE - ACCRA', 'Head Office-Accra')
AND location != 'Head Office';

UPDATE toner_usage 
SET location_name = 'Head Office'
WHERE location_name IN ('Head Office - Accra', 'head office - accra', 'HEAD OFFICE - ACCRA', 'Head Office-Accra')
AND location_name != 'Head Office';

UPDATE stock_assignments 
SET location = 'Head Office'
WHERE location IN ('Head Office - Accra', 'head office - accra', 'HEAD OFFICE - ACCRA', 'Head Office-Accra')
AND location != 'Head Office';

-- Note: stock_movements is a view and cannot be updated directly, it will automatically reflect changes from underlying tables

UPDATE store_requisitions 
SET location = 'Head Office'
WHERE location IN ('Head Office - Accra', 'head office - accra', 'HEAD OFFICE - ACCRA', 'Head Office-Accra')
AND location != 'Head Office';

UPDATE repair_invoices 
SET service_provider_name = REPLACE(service_provider_name, 'Head Office - Accra', 'Head Office')
WHERE service_provider_name LIKE '%Head Office - Accra%';

-- Step 2: Consolidate lookup_locations table
UPDATE lookup_locations 
SET name = 'Head Office'
WHERE name IN ('Head Office - Accra', 'head office - accra', 'HEAD OFFICE - ACCRA', 'Head Office-Accra')
AND name != 'Head Office';

-- Step 3: Delete duplicate location entries if they exist
DELETE FROM lookup_locations 
WHERE name IN ('Head Office - Accra', 'head office - accra', 'HEAD OFFICE - ACCRA', 'Head Office-Accra')
AND name != 'Head Office'
AND is_active = false;

-- Add comment for audit
COMMENT ON TABLE devices IS 'Updated: Merged Head Office - Accra with Head Office location (2026-02-25)';

SELECT 'Location merge completed successfully' AS status;
