-- ============================================================
-- FIX: Standardize all location values to Title Case
-- Run this in Supabase SQL Editor
-- ============================================================

-- Show current location inconsistencies
SELECT 'BEFORE FIX - Location variations in store_items:' as info;
SELECT DISTINCT location, COUNT(*) as count
FROM store_items
GROUP BY location
ORDER BY location;

-- Standardize locations in store_items table
UPDATE store_items SET location = 'Head Office' WHERE location = 'head_office';
UPDATE store_items SET location = 'Central Stores' WHERE location = 'central_stores';
UPDATE store_items SET location = 'Kumasi' WHERE location = 'kumasi';
UPDATE store_items SET location = 'Takoradi' WHERE location = 'takoradi';
UPDATE store_items SET location = 'Kaase' WHERE location = 'kaase';
UPDATE store_items SET location = 'Tema' WHERE location = 'tema';
UPDATE store_items SET location = 'Tarkwa' WHERE location = 'tarkwa';

-- Standardize locations in store_requisitions table
UPDATE store_requisitions SET location = 'Head Office' WHERE location = 'head_office';
UPDATE store_requisitions SET location = 'Central Stores' WHERE location = 'central_stores';
UPDATE store_requisitions SET destination_location = 'Head Office' WHERE destination_location = 'head_office';
UPDATE store_requisitions SET destination_location = 'Central Stores' WHERE destination_location = 'central_stores';
UPDATE store_requisitions SET destination_location = 'Kumasi' WHERE destination_location = 'kumasi';
UPDATE store_requisitions SET destination_location = 'Takoradi' WHERE destination_location = 'takoradi';
UPDATE store_requisitions SET destination_location = 'Kaase' WHERE destination_location = 'kaase';
UPDATE store_requisitions SET destination_location = 'Tema' WHERE destination_location = 'tema';
UPDATE store_requisitions SET destination_location = 'Tarkwa' WHERE destination_location = 'tarkwa';

-- Show results after fix
SELECT 'AFTER FIX - Location values in store_items:' as info;
SELECT DISTINCT location, COUNT(*) as count
FROM store_items
GROUP BY location
ORDER BY location;

-- Verify HP COLOUR LASERJET 3303 now has correct location
SELECT 'HP LASERJET VERIFICATION:' as info;
SELECT id, name, location, quantity
FROM store_items
WHERE name ILIKE '%HP%LASERJET%'
ORDER BY location;

-- Verify items available for assignment at Head Office
SELECT 'HEAD OFFICE ITEMS AVAILABLE FOR ASSIGNMENT:' as info;
SELECT name, category, location, quantity
FROM store_items
WHERE location = 'Head Office' AND quantity > 0
ORDER BY name;
