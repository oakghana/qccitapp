-- ============================================================
-- Migration: Merge duplicate Western North and Western South locations
-- Merges all variations (wn, Western North, western_north) into "Western North"
-- Merges all variations (ws, Western South, western_south) into "Western South"
-- Run this in Supabase SQL Editor
-- ============================================================

-- Show before state
SELECT '[BEFORE] Location variations in profiles:' as info;
SELECT DISTINCT location, COUNT(*) as count
FROM profiles
WHERE location IN ('wn', 'Western North', 'western_north', 'ws', 'Western South', 'western_south')
GROUP BY location
ORDER BY location;

SELECT '[BEFORE] Location variations in devices:' as info;
SELECT DISTINCT location, COUNT(*) as count
FROM devices
WHERE location IN ('wn', 'Western North', 'western_north', 'ws', 'Western South', 'western_south')
GROUP BY location
ORDER BY location;

-- Merge Western North variants in profiles table
UPDATE profiles SET location = 'Western North' 
WHERE location IN ('wn', 'western_north', 'Western North')
  AND location IS NOT NULL;

-- Merge Western South variants in profiles table
UPDATE profiles SET location = 'Western South' 
WHERE location IN ('ws', 'western_south', 'Western South')
  AND location IS NOT NULL;

-- Merge Western North variants in devices table
UPDATE devices SET location = 'Western North' 
WHERE location IN ('wn', 'western_north', 'Western North')
  AND location IS NOT NULL;

-- Merge Western South variants in devices table
UPDATE devices SET location = 'Western South' 
WHERE location IN ('ws', 'western_south', 'Western South')
  AND location IS NOT NULL;

-- Merge Western North variants in service_tickets table
UPDATE service_tickets SET location = 'Western North' 
WHERE location IN ('wn', 'western_north', 'Western North')
  AND location IS NOT NULL;

-- Merge Western South variants in service_tickets table
UPDATE service_tickets SET location = 'Western South' 
WHERE location IN ('ws', 'western_south', 'Western South')
  AND location IS NOT NULL;

-- Verify after state
SELECT '[AFTER] Merged Western locations in profiles:' as info;
SELECT DISTINCT location, COUNT(*) as count
FROM profiles
WHERE location IN ('Western North', 'Western South')
GROUP BY location
ORDER BY location;

SELECT '[AFTER] Merged Western locations in devices:' as info;
SELECT DISTINCT location, COUNT(*) as count
FROM devices
WHERE location IN ('Western North', 'Western South')
GROUP BY location
ORDER BY location;

SELECT '[AFTER] Merged Western locations in service_tickets:' as info;
SELECT DISTINCT location, COUNT(*) as count
FROM service_tickets
WHERE location IN ('Western North', 'Western South')
GROUP BY location
ORDER BY location;

-- Show total devices by location (merged view)
SELECT '[MERGED SUMMARY] All devices by canonical location:' as info;
SELECT 
  CASE 
    WHEN location IN ('wn', 'western_north', 'Western North') THEN 'Western North'
    WHEN location IN ('ws', 'western_south', 'Western South') THEN 'Western South'
    ELSE location
  END as canonical_location,
  COUNT(*) as device_count
FROM devices
WHERE location IS NOT NULL AND location != ''
GROUP BY canonical_location
ORDER BY device_count DESC;
