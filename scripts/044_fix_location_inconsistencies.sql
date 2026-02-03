-- Fix Location Inconsistencies and Standardize Database
-- This script normalizes all location names to consistent format

-- Step 1: Create a mapping of current locations to standardized names
DO $$
DECLARE
  location_mappings TEXT[][] := ARRAY[
    ARRAY['head_office', 'Head Office'],
    ARRAY['Head Office', 'Head Office'],
    ARRAY['cr', 'Central Region'],
    ARRAY['CR', 'Central Region'],
    ARRAY['er', 'Eastern Region'],
    ARRAY['ER', 'Eastern Region'],
    ARRAY['eastern', 'Eastern Region'],
    ARRAY['kaase', 'Kaase'],
    ARRAY['Kaase', 'Kaase'],
    ARRAY['kumasi', 'Kumasi'],
    ARRAY['Kumasi', 'Kumasi'],
    ARRAY['takoradi_port', 'Takoradi Port'],
    ARRAY['Takoradi Port', 'Takoradi Port'],
    ARRAY['tema_port', 'Tema Port'],
    ARRAY['Tema Port', 'Tema Port'],
    ARRAY['tema_research', 'Tema Research'],
    ARRAY['Tema Research', 'Tema Research'],
    ARRAY['tema_training_school', 'Tema Training School'],
    ARRAY['Tema Training School', 'Tema Training School'],
    ARRAY['vr', 'Volta Region'],
    ARRAY['VR', 'Volta Region'],
    ARRAY['wn', 'Western North'],
    ARRAY['WN', 'Western North'],
    ARRAY['ws', 'Western South'],
    ARRAY['WS', 'Western South'],
    ARRAY['bar', 'BAR'],
    ARRAY['BAR', 'BAR']
  ];
  mapping TEXT[];
BEGIN
  -- Update devices table
  FOREACH mapping SLICE 1 IN ARRAY location_mappings
  LOOP
    UPDATE devices 
    SET location = mapping[2]
    WHERE location = mapping[1];
    
    RAISE NOTICE 'Updated devices: % -> %', mapping[1], mapping[2];
  END LOOP;

  -- Update store_items table
  FOREACH mapping SLICE 1 IN ARRAY location_mappings
  LOOP
    UPDATE store_items 
    SET location = mapping[2]
    WHERE location = mapping[1];
    
    RAISE NOTICE 'Updated store_items: % -> %', mapping[1], mapping[2];
  END LOOP;

  -- Update store_requisitions table
  FOREACH mapping SLICE 1 IN ARRAY location_mappings
  LOOP
    UPDATE store_requisitions 
    SET location = mapping[2]
    WHERE location = mapping[1];
    
    RAISE NOTICE 'Updated store_requisitions: % -> %', mapping[1], mapping[2];
  END LOOP;

  -- Update profiles table
  FOREACH mapping SLICE 1 IN ARRAY location_mappings
  LOOP
    UPDATE profiles 
    SET location = mapping[2]
    WHERE location = mapping[1];
    
    RAISE NOTICE 'Updated profiles: % -> %', mapping[1], mapping[2];
  END LOOP;

  -- Update stock_transfers table if exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_transfers') THEN
    FOREACH mapping SLICE 1 IN ARRAY location_mappings
    LOOP
      UPDATE stock_transfers 
      SET from_location = mapping[2]
      WHERE from_location = mapping[1];
      
      UPDATE stock_transfers 
      SET to_location = mapping[2]
      WHERE to_location = mapping[1];
    END LOOP;
  END IF;

  -- Update stock_transactions table if exists (check column structure first)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_transactions') THEN
    -- Check if location column exists
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'stock_transactions' AND column_name = 'location') THEN
      FOREACH mapping SLICE 1 IN ARRAY location_mappings
      LOOP
        UPDATE stock_transactions 
        SET location = mapping[2]
        WHERE location = mapping[1];
      END LOOP;
      RAISE NOTICE 'Updated stock_transactions location column';
    END IF;
    
    -- Check if location_name column exists
    IF EXISTS (SELECT FROM information_schema.columns 
               WHERE table_name = 'stock_transactions' AND column_name = 'location_name') THEN
      FOREACH mapping SLICE 1 IN ARRAY location_mappings
      LOOP
        UPDATE stock_transactions 
        SET location_name = mapping[2]
        WHERE location_name = mapping[1];
      END LOOP;
      RAISE NOTICE 'Updated stock_transactions location_name column';
    END IF;
  END IF;
END $$;

-- Step 2: Create a locations reference table for consistent lookups
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns and constraints to locations table if they don't exist
DO $$ 
BEGIN
  -- Add unique constraint on name if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'locations_name_key') THEN
    ALTER TABLE locations ADD CONSTRAINT locations_name_key UNIQUE (name);
  END IF;
  
  -- Add unique constraint on code if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'locations_code_key') THEN
    ALTER TABLE locations ADD CONSTRAINT locations_code_key UNIQUE (code);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'type') THEN
    ALTER TABLE locations ADD COLUMN type VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'region') THEN
    ALTER TABLE locations ADD COLUMN region VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'is_active') THEN
    ALTER TABLE locations ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Insert standardized locations
INSERT INTO locations (name, code, type, region, is_active) VALUES
  ('Head Office', 'HO', 'head_office', 'Greater Accra', true),
  ('Central Region', 'CR', 'regional', 'Central', true),
  ('Eastern Region', 'ER', 'regional', 'Eastern', true),
  ('Kaase', 'KS', 'regional', 'Ashanti', true),
  ('Kumasi', 'KM', 'regional', 'Ashanti', true),
  ('Takoradi Port', 'TP', 'port', 'Western', true),
  ('Tema Port', 'TMP', 'port', 'Greater Accra', true),
  ('Tema Research', 'TR', 'research', 'Greater Accra', true),
  ('Tema Training School', 'TTS', 'training', 'Greater Accra', true),
  ('Volta Region', 'VR', 'regional', 'Volta', true),
  ('Western North', 'WN', 'regional', 'Western North', true),
  ('Western South', 'WS', 'regional', 'Western', true),
  ('BAR', 'BAR', 'regional', 'Bono Ahafo', true)
ON CONFLICT (name) DO NOTHING;

-- Step 3: Show summary after cleanup
SELECT 
  'devices' as table_name,
  location,
  COUNT(*) as count
FROM devices
WHERE location IS NOT NULL AND location != ''
GROUP BY location
ORDER BY location;

SELECT 
  'store_items' as table_name,
  location,
  COUNT(*) as count,
  SUM(quantity) as total_quantity
FROM store_items
WHERE location IS NOT NULL AND location != ''
GROUP BY location
ORDER BY location;

SELECT 
  'profiles' as table_name,
  location,
  COUNT(*) as count
FROM profiles
WHERE location IS NOT NULL AND location != ''
GROUP BY location
ORDER BY location;
