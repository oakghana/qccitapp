-- Add 'maintenance' value to device_status enum type
-- This migration adds support for the "Under Maintenance" device status used in repair workflows

-- Simply add the new enum value to the existing type
-- This is safer than recreating the enum and works with dependent views
ALTER TYPE device_status ADD VALUE 'maintenance' BEFORE 'retired';

-- Add comment for documentation
COMMENT ON TYPE device_status IS 'Device status: active (in use), maintenance (under repair), retired (no longer in use)';
