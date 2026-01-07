-- Update locations to match new requirements
-- New locations: Head Office, Tema Port, Tema Research, Tema Training School, Kumasi, Kaase, WS, WN, VR, BAR, Nsawam

-- First, update the location enum type if it exists
DO $$
BEGIN
  -- Drop the old constraint if it exists
  ALTER TABLE IF EXISTS user_profiles DROP CONSTRAINT IF EXISTS user_profiles_location_check;
  ALTER TABLE IF EXISTS devices DROP CONSTRAINT IF EXISTS devices_location_check;
  ALTER TABLE IF EXISTS service_desk_tickets DROP CONSTRAINT IF EXISTS service_desk_tickets_location_check;
  ALTER TABLE IF EXISTS repair_requests DROP CONSTRAINT IF EXISTS repair_requests_location_check;
  ALTER TABLE IF EXISTS store_items DROP CONSTRAINT IF EXISTS store_items_location_check;
  ALTER TABLE IF EXISTS store_requisitions DROP CONSTRAINT IF EXISTS store_requisitions_location_check;
END $$;

-- Update existing location values to new standard
UPDATE user_profiles 
SET location = CASE 
  WHEN location IN ('accra', 'head_office') THEN 'head_office'
  WHEN location = 'kumasi' THEN 'kumasi'
  WHEN location = 'kaase_inland_port' THEN 'kaase'
  WHEN location = 'cape_coast' THEN 'head_office'
  ELSE 'head_office'
END;

UPDATE devices 
SET location = CASE 
  WHEN location IN ('accra', 'head_office') THEN 'head_office'
  WHEN location = 'kumasi' THEN 'kumasi'
  WHEN location = 'kaase_inland_port' THEN 'kaase'
  WHEN location = 'cape_coast' THEN 'head_office'
  ELSE 'head_office'
END;

UPDATE service_desk_tickets 
SET location = CASE 
  WHEN location IN ('accra', 'head_office') THEN 'head_office'
  WHEN location = 'kumasi' THEN 'kumasi'
  WHEN location = 'kaase_inland_port' THEN 'kaase'
  WHEN location = 'cape_coast' THEN 'head_office'
  ELSE 'head_office'
END;

UPDATE repair_requests 
SET location = CASE 
  WHEN location IN ('accra', 'head_office') THEN 'head_office'
  WHEN location = 'kumasi' THEN 'kumasi'
  WHEN location = 'kaase_inland_port' THEN 'kaase'
  WHEN location = 'cape_coast' THEN 'head_office'
  ELSE 'head_office'
END;

UPDATE store_items 
SET location = CASE 
  WHEN location IN ('accra', 'head_office') THEN 'head_office'
  WHEN location = 'kumasi' THEN 'kumasi'
  WHEN location = 'kaase_inland_port' THEN 'kaase'
  WHEN location = 'cape_coast' THEN 'head_office'
  ELSE 'head_office'
END;

UPDATE store_requisitions 
SET location = CASE 
  WHEN location IN ('accra', 'head_office') THEN 'head_office'
  WHEN location = 'kumasi' THEN 'kumasi'
  WHEN location = 'kaase_inland_port' THEN 'kaase'
  WHEN location = 'cape_coast' THEN 'head_office'
  ELSE 'head_office'
END;

-- Add new location constraints
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_location_check 
CHECK (location IN ('head_office', 'tema_port', 'tema_research', 'tema_training_school', 'kumasi', 'kaase', 'ws', 'wn', 'vr', 'bar', 'nsawam'));

ALTER TABLE devices ADD CONSTRAINT devices_location_check 
CHECK (location IN ('head_office', 'tema_port', 'tema_research', 'tema_training_school', 'kumasi', 'kaase', 'ws', 'wn', 'vr', 'bar', 'nsawam'));

ALTER TABLE service_desk_tickets ADD CONSTRAINT service_desk_tickets_location_check 
CHECK (location IN ('head_office', 'tema_port', 'tema_research', 'tema_training_school', 'kumasi', 'kaase', 'ws', 'wn', 'vr', 'bar', 'nsawam'));

ALTER TABLE repair_requests ADD CONSTRAINT repair_requests_location_check 
CHECK (location IN ('head_office', 'tema_port', 'tema_research', 'tema_training_school', 'kumasi', 'kaase', 'ws', 'wn', 'vr', 'bar', 'nsawam'));

ALTER TABLE store_items ADD CONSTRAINT store_items_location_check 
CHECK (location IN ('head_office', 'tema_port', 'tema_research', 'tema_training_school', 'kumasi', 'kaase', 'ws', 'wn', 'vr', 'bar', 'nsawam'));

ALTER TABLE store_requisitions ADD CONSTRAINT store_requisitions_location_check 
CHECK (location IN ('head_office', 'tema_port', 'tema_research', 'tema_training_school', 'kumasi', 'kaase', 'ws', 'wn', 'vr', 'bar', 'nsawam'));
