-- Add columns to track who assigned the service provider and when
ALTER TABLE repair_requests 
ADD COLUMN IF NOT EXISTS service_provider_assigned_by text,
ADD COLUMN IF NOT EXISTS service_provider_assigned_date timestamp with time zone;

-- Add comment to explain the columns
COMMENT ON COLUMN repair_requests.service_provider_assigned_by IS 'Name of the user who assigned the service provider';
COMMENT ON COLUMN repair_requests.service_provider_assigned_date IS 'Date and time when the service provider was assigned';
