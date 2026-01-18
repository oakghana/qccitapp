-- 023_normalize_store_locations.sql
-- Normalize `store_items.location` values to canonical labels from LOCATIONS
-- Run this in Supabase SQL editor. Review results before applying.

BEGIN;

-- For each known location key => label mapping, set the location to the canonical label
UPDATE store_items SET location = 'Head Office' WHERE lower(trim(location)) = 'head_office' OR lower(trim(location)) = 'head office' OR lower(trim(location)) = 'headoffice';
UPDATE store_items SET location = 'Central Stores' WHERE lower(trim(location)) = 'central_stores' OR lower(trim(location)) = 'central stores' OR lower(trim(location)) = 'central';
UPDATE store_items SET location = 'Tema Port' WHERE lower(trim(location)) = 'tema_port' OR lower(trim(location)) = 'tema port' OR lower(trim(location)) = 'tema';
UPDATE store_items SET location = 'Takoradi Port' WHERE lower(trim(location)) = 'takoradi_port' OR lower(trim(location)) = 'takoradi port' OR lower(trim(location)) = 'takoradi';
UPDATE store_items SET location = 'Tema Research' WHERE lower(trim(location)) = 'tema_research' OR lower(trim(location)) = 'tema research';
UPDATE store_items SET location = 'Tema Training School' WHERE lower(trim(location)) = 'tema_training_school' OR lower(trim(location)) = 'tema training school';
UPDATE store_items SET location = 'Kumasi' WHERE lower(trim(location)) = 'kumasi' OR lower(trim(location)) = 'kumasi gh';
UPDATE store_items SET location = 'Kaase' WHERE lower(trim(location)) = 'kaase' OR lower(trim(location)) = 'kaase_inland_port' OR lower(trim(location)) = 'kaase inland port';
UPDATE store_items SET location = 'WS' WHERE lower(trim(location)) = 'ws';
UPDATE store_items SET location = 'WN' WHERE lower(trim(location)) = 'wn';
UPDATE store_items SET location = 'VR' WHERE lower(trim(location)) = 'vr';
UPDATE store_items SET location = 'BAR' WHERE lower(trim(location)) = 'bar';
UPDATE store_items SET location = 'Eastern' WHERE lower(trim(location)) = 'eastern';
UPDATE store_items SET location = 'Nsawam' WHERE lower(trim(location)) = 'nsawam';
UPDATE store_items SET location = 'CR' WHERE lower(trim(location)) = 'cr';
UPDATE store_items SET location = 'Cape Coast' WHERE lower(trim(location)) = 'cape_coast' OR lower(trim(location)) = 'cape coast';
UPDATE store_items SET location = 'Sunyani' WHERE lower(trim(location)) = 'sunyani';

-- As a final normalization, trim whitespace and collapse multiple spaces
UPDATE store_items SET location = regexp_replace(trim(location), '\s+', ' ', 'g') WHERE location IS NOT NULL;

COMMIT;

-- NOTE:
-- 1) Run SELECT queries first to preview affected rows, e.g.:
--    SELECT DISTINCT location FROM store_items ORDER BY location;
-- 2) Adjust the mapping above if you have other variants in your DB.
-- 3) Consider backing up the table before running this migration.
