-- Add user_id column to service_providers table to link service providers to their login credentials
-- This allows service providers to log in and see their assigned repair tasks

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'service_providers' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE service_providers ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);

-- Add comment for documentation
COMMENT ON COLUMN service_providers.user_id IS 'Links to profiles table for login credentials. Service providers with a user_id can log in to view their assigned repairs.';
