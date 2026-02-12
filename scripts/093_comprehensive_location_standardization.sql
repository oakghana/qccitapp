-- Migration: Comprehensive location standardization for all remaining variations
-- Purpose: Consolidate all location name variations into their proper canonical forms
-- Tables affected: devices, profiles, service_tickets, store_items, store_requisitions
-- Handled variations:
--   Tema Research: tema_research → Tema Research
--   Tema Training School: tema_training_school → Tema Training School-TSCH
--   Central Region: cr → Central Region
--   Head Office: head_office → Head Office
--   Eastern Region: er, eastern → Eastern Region
--   Volta Region: vr, volta → Volta Region
--   Kumasi: kumasi → Kumasi
--   Tema Port: tema_port → Tema Port
--   Kaase: kaase → Kaase
--   Takoradi Port: takoradi_port → Takoradi Port

BEGIN;

-- ============================================
-- DEVICES TABLE STANDARDIZATION
-- ============================================

SELECT '[BEFORE] Unique locations in devices:' as phase;
SELECT DISTINCT location, COUNT(*) as count 
FROM devices 
WHERE location IS NOT NULL AND location != ''
GROUP BY location 
ORDER BY count DESC;

-- Tema Research variations
UPDATE devices SET location = 'Tema Research' 
WHERE LOWER(TRIM(location)) IN ('tema_research', 'tema research') 
  AND location != 'Tema Research';

-- Tema Training School variations
UPDATE devices SET location = 'Tema Training School-TSCH' 
WHERE LOWER(TRIM(location)) IN ('tema_training_school', 'tema training school', 'tema training school-tsch') 
  AND location != 'Tema Training School-TSCH';

-- Central Region variations
UPDATE devices SET location = 'Central Region' 
WHERE LOWER(TRIM(location)) IN ('cr', 'central region', 'central_region') 
  AND location != 'Central Region';

-- Head Office variations
UPDATE devices SET location = 'Head Office' 
WHERE LOWER(TRIM(location)) IN ('head_office', 'head office') 
  AND location != 'Head Office';

-- Eastern Region variations
UPDATE devices SET location = 'Eastern Region' 
WHERE LOWER(TRIM(location)) IN ('er', 'eastern', 'eastern_region', 'eastern region') 
  AND location != 'Eastern Region';

-- Volta Region variations
UPDATE devices SET location = 'Volta Region' 
WHERE LOWER(TRIM(location)) IN ('vr', 'volta', 'volta_region', 'volta region') 
  AND location != 'Volta Region';

-- Kumasi variations
UPDATE devices SET location = 'Kumasi' 
WHERE LOWER(TRIM(location)) IN ('kumasi', 'km') 
  AND location != 'Kumasi';

-- Tema Port variations
UPDATE devices SET location = 'Tema Port' 
WHERE LOWER(TRIM(location)) IN ('tema_port', 'tema port') 
  AND location != 'Tema Port';

-- Kaase variations
UPDATE devices SET location = 'Kaase' 
WHERE LOWER(TRIM(location)) IN ('kaase', 'ka') 
  AND location != 'Kaase';

-- Takoradi Port variations
UPDATE devices SET location = 'Takoradi Port' 
WHERE LOWER(TRIM(location)) IN ('takoradi_port', 'takoradi port') 
  AND location != 'Takoradi Port';

-- ============================================
-- PROFILES TABLE STANDARDIZATION
-- ============================================

-- Tema Research variations
UPDATE profiles SET location = 'Tema Research' 
WHERE LOWER(TRIM(location)) IN ('tema_research', 'tema research') 
  AND location != 'Tema Research';

-- Tema Training School variations
UPDATE profiles SET location = 'Tema Training School-TSCH' 
WHERE LOWER(TRIM(location)) IN ('tema_training_school', 'tema training school', 'tema training school-tsch') 
  AND location != 'Tema Training School-TSCH';

-- Central Region variations
UPDATE profiles SET location = 'Central Region' 
WHERE LOWER(TRIM(location)) IN ('cr', 'central region', 'central_region') 
  AND location != 'Central Region';

-- Head Office variations
UPDATE profiles SET location = 'Head Office' 
WHERE LOWER(TRIM(location)) IN ('head_office', 'head office') 
  AND location != 'Head Office';

-- Eastern Region variations
UPDATE profiles SET location = 'Eastern Region' 
WHERE LOWER(TRIM(location)) IN ('er', 'eastern', 'eastern_region', 'eastern region') 
  AND location != 'Eastern Region';

-- Volta Region variations
UPDATE profiles SET location = 'Volta Region' 
WHERE LOWER(TRIM(location)) IN ('vr', 'volta', 'volta_region', 'volta region') 
  AND location != 'Volta Region';

-- Kumasi variations
UPDATE profiles SET location = 'Kumasi' 
WHERE LOWER(TRIM(location)) IN ('kumasi', 'km') 
  AND location != 'Kumasi';

-- Tema Port variations
UPDATE profiles SET location = 'Tema Port' 
WHERE LOWER(TRIM(location)) IN ('tema_port', 'tema port') 
  AND location != 'Tema Port';

-- Kaase variations
UPDATE profiles SET location = 'Kaase' 
WHERE LOWER(TRIM(location)) IN ('kaase', 'ka') 
  AND location != 'Kaase';

-- Takoradi Port variations
UPDATE profiles SET location = 'Takoradi Port' 
WHERE LOWER(TRIM(location)) IN ('takoradi_port', 'takoradi port') 
  AND location != 'Takoradi Port';

-- ============================================
-- SERVICE_TICKETS TABLE STANDARDIZATION
-- ============================================

-- Tema Research variations
UPDATE service_tickets SET location = 'Tema Research' 
WHERE LOWER(TRIM(location)) IN ('tema_research', 'tema research') 
  AND location != 'Tema Research';

-- Tema Training School variations
UPDATE service_tickets SET location = 'Tema Training School-TSCH' 
WHERE LOWER(TRIM(location)) IN ('tema_training_school', 'tema training school', 'tema training school-tsch') 
  AND location != 'Tema Training School-TSCH';

-- Central Region variations
UPDATE service_tickets SET location = 'Central Region' 
WHERE LOWER(TRIM(location)) IN ('cr', 'central region', 'central_region') 
  AND location != 'Central Region';

-- Head Office variations
UPDATE service_tickets SET location = 'Head Office' 
WHERE LOWER(TRIM(location)) IN ('head_office', 'head office') 
  AND location != 'Head Office';

-- Eastern Region variations
UPDATE service_tickets SET location = 'Eastern Region' 
WHERE LOWER(TRIM(location)) IN ('er', 'eastern', 'eastern_region', 'eastern region') 
  AND location != 'Eastern Region';

-- Volta Region variations
UPDATE service_tickets SET location = 'Volta Region' 
WHERE LOWER(TRIM(location)) IN ('vr', 'volta', 'volta_region', 'volta region') 
  AND location != 'Volta Region';

-- Kumasi variations
UPDATE service_tickets SET location = 'Kumasi' 
WHERE LOWER(TRIM(location)) IN ('kumasi', 'km') 
  AND location != 'Kumasi';

-- Tema Port variations
UPDATE service_tickets SET location = 'Tema Port' 
WHERE LOWER(TRIM(location)) IN ('tema_port', 'tema port') 
  AND location != 'Tema Port';

-- Kaase variations
UPDATE service_tickets SET location = 'Kaase' 
WHERE LOWER(TRIM(location)) IN ('kaase', 'ka') 
  AND location != 'Kaase';

-- Takoradi Port variations
UPDATE service_tickets SET location = 'Takoradi Port' 
WHERE LOWER(TRIM(location)) IN ('takoradi_port', 'takoradi port') 
  AND location != 'Takoradi Port';

-- ============================================
-- STORE_ITEMS TABLE STANDARDIZATION
-- ============================================

-- Tema Research variations
UPDATE store_items SET location = 'Tema Research' 
WHERE LOWER(TRIM(location)) IN ('tema_research', 'tema research') 
  AND location != 'Tema Research';

-- Tema Training School variations
UPDATE store_items SET location = 'Tema Training School-TSCH' 
WHERE LOWER(TRIM(location)) IN ('tema_training_school', 'tema training school', 'tema training school-tsch') 
  AND location != 'Tema Training School-TSCH';

-- Central Region variations
UPDATE store_items SET location = 'Central Region' 
WHERE LOWER(TRIM(location)) IN ('cr', 'central region', 'central_region') 
  AND location != 'Central Region';

-- Head Office variations
UPDATE store_items SET location = 'Head Office' 
WHERE LOWER(TRIM(location)) IN ('head_office', 'head office') 
  AND location != 'Head Office';

-- Kumasi variations
UPDATE store_items SET location = 'Kumasi' 
WHERE LOWER(TRIM(location)) IN ('kumasi', 'km', 'kumasi') 
  AND location != 'Kumasi';

-- Tema Port variations
UPDATE store_items SET location = 'Tema Port' 
WHERE LOWER(TRIM(location)) IN ('tema_port', 'tema port', 'tema') 
  AND location != 'Tema Port';

-- Takoradi Port variations
UPDATE store_items SET location = 'Takoradi Port' 
WHERE LOWER(TRIM(location)) IN ('takoradi_port', 'takoradi port', 'takoradi') 
  AND location != 'Takoradi Port';

-- ============================================
-- STORE_REQUISITIONS TABLE STANDARDIZATION
-- ============================================

-- Destination location variations - Tema Research
UPDATE store_requisitions SET destination_location = 'Tema Research' 
WHERE LOWER(TRIM(destination_location)) IN ('tema_research', 'tema research') 
  AND destination_location != 'Tema Research';

-- Destination location variations - Kumasi
UPDATE store_requisitions SET destination_location = 'Kumasi' 
WHERE LOWER(TRIM(destination_location)) IN ('kumasi', 'km') 
  AND destination_location != 'Kumasi';

-- Destination location variations - Tema Port
UPDATE store_requisitions SET destination_location = 'Tema Port' 
WHERE LOWER(TRIM(destination_location)) IN ('tema_port', 'tema port', 'tema') 
  AND destination_location != 'Tema Port';

-- Destination location variations - Tema Training School
UPDATE store_requisitions SET destination_location = 'Tema Training School-TSCH' 
WHERE LOWER(TRIM(destination_location)) IN ('tema_training_school', 'tema training school', 'tema training school-tsch') 
  AND destination_location != 'Tema Training School-TSCH';

-- ============================================
-- FINAL VERIFICATION
-- ============================================

SELECT '[AFTER] Unique locations in devices (standardized):' as phase;
SELECT DISTINCT location, COUNT(*) as count 
FROM devices 
WHERE location IS NOT NULL AND location != ''
GROUP BY location 
ORDER BY count DESC;

SELECT '[SUMMARY] Device count by canonical location:' as phase;
SELECT location as canonical_location, COUNT(*) as device_count 
FROM devices 
WHERE location IS NOT NULL AND location != ''
GROUP BY location 
ORDER BY device_count DESC;

SELECT '[SUMMARY] Profile count by canonical location:' as phase;
SELECT location as canonical_location, COUNT(*) as profile_count 
FROM profiles 
WHERE location IS NOT NULL AND location != ''
GROUP BY location 
ORDER BY profile_count DESC;

SELECT '[SUMMARY] Service ticket count by canonical location:' as phase;
SELECT location as canonical_location, COUNT(*) as ticket_count 
FROM service_tickets 
WHERE location IS NOT NULL AND location != ''
GROUP BY location 
ORDER BY ticket_count DESC;

COMMIT;
