-- Migration: Standardize all remaining location inconsistencies
-- This script consolidates all location name variations into their proper canonical forms
-- Handles: tema_research/Tema Research, tema_training_school/Tema Training School, cr/Central Region, head_office/Head Office

-- Show current state before standardization
SELECT '[BEFORE] All unique locations in devices:' as info;
SELECT DISTINCT location, COUNT(*) as count 
FROM devices 
WHERE location IS NOT NULL AND location != ''
GROUP BY location 
ORDER BY count DESC;

-- Standardize tema_research variations
UPDATE devices 
SET location = 'Tema Research' 
WHERE LOWER(TRIM(location)) = 'tema_research' 
  AND location != 'Tema Research';

-- Standardize tema_training_school variations  
UPDATE devices 
SET location = 'Tema Training School-TSCH' 
WHERE LOWER(TRIM(location)) = 'tema_training_school' 
  AND location != 'Tema Training School-TSCH';

-- Standardize central region variations
UPDATE devices 
SET location = 'Central Region' 
WHERE LOWER(TRIM(location)) = 'cr' 
  AND location != 'Central Region';

-- Standardize head_office variations
UPDATE devices 
SET location = 'Head Office' 
WHERE LOWER(TRIM(location)) = 'head_office' 
  AND location != 'Head Office';

-- Also update profiles table for consistency
UPDATE profiles 
SET location = 'Tema Research' 
WHERE LOWER(TRIM(location)) = 'tema_research' 
  AND location != 'Tema Research';

UPDATE profiles 
SET location = 'Tema Training School-TSCH' 
WHERE LOWER(TRIM(location)) = 'tema_training_school' 
  AND location != 'Tema Training School-TSCH';

UPDATE profiles 
SET location = 'Central Region' 
WHERE LOWER(TRIM(location)) = 'cr' 
  AND location != 'Central Region';

UPDATE profiles 
SET location = 'Head Office' 
WHERE LOWER(TRIM(location)) = 'head_office' 
  AND location != 'Head Office';

-- Show final state after standardization
SELECT '[AFTER] All unique locations in devices (standardized):' as info;
SELECT DISTINCT location, COUNT(*) as count 
FROM devices 
WHERE location IS NOT NULL AND location != ''
GROUP BY location 
ORDER BY count DESC;

SELECT '[SUMMARY] Final device count by canonical location:' as info;
SELECT location as canonical_location, COUNT(*) as device_count 
FROM devices 
WHERE location IS NOT NULL AND location != ''
GROUP BY location 
ORDER BY device_count DESC;
