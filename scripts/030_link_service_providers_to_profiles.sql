-- Migration: Link Service Providers to User Profiles
-- This allows service providers to log in with their credentials and see assigned repair tasks

-- Add user_id column to service_providers table to link to profiles
ALTER TABLE service_providers
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);

-- Update repair_requests to ensure service_provider_id links properly
-- Add index on service_provider_id for faster queries
CREATE INDEX IF NOT EXISTS idx_repair_requests_service_provider_id ON repair_requests(service_provider_id);

-- Update repair_tasks to ensure service_provider_id links properly
CREATE INDEX IF NOT EXISTS idx_repair_tasks_service_provider_id ON repair_tasks(service_provider_id);

-- Add RLS policy for service providers to view their own repairs
-- Service providers can only see repair requests assigned to them
DO $$
BEGIN
    -- Drop existing policy if it exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'repair_requests' 
        AND policyname = 'service_providers_can_view_their_repairs'
    ) THEN
        DROP POLICY service_providers_can_view_their_repairs ON repair_requests;
    END IF;
END $$;

-- Note: RLS is currently disabled on repair_requests, but this prepares for future RLS enablement
-- CREATE POLICY service_providers_can_view_their_repairs ON repair_requests
--   FOR SELECT
--   USING (
--     service_provider_id IN (
--       SELECT id FROM service_providers WHERE user_id = auth.uid()
--     )
--   );

-- Add comment explaining the relationship
COMMENT ON COLUMN service_providers.user_id IS 'Links to profiles table for user authentication - allows service providers to log in and view their assigned repairs';
