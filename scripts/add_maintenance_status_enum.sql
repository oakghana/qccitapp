-- Add 'maintenance' value to device_status enum type
-- This migration adds support for the "Under Maintenance" device status used in repair workflows

-- First, rename the existing enum type
ALTER TYPE device_status RENAME TO device_status_old;

-- Create the new enum type with all values including 'maintenance'
CREATE TYPE device_status AS ENUM ('active', 'maintenance', 'retired');

-- Update the column to use the new enum
ALTER TABLE devices 
  ALTER COLUMN status TYPE device_status USING status::text::device_status;

-- Drop the old enum type
DROP TYPE device_status_old;

-- Add comment for documentation
COMMENT ON TYPE device_status IS 'Device status: active (in use), maintenance (under repair), retired (no longer in use)';
