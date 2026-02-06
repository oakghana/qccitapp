-- Sync service providers from profiles table to service_providers table
-- This ensures that all users with role='service_provider' have an entry in service_providers table

INSERT INTO service_providers (id, name, email, phone, location, user_id, is_active, created_at)
SELECT 
  gen_random_uuid() as id,
  full_name as name,
  email,
  phone,
  location,
  id as user_id,
  CASE 
    WHEN status = 'Active' THEN true
    ELSE false
  END as is_active,
  NOW() as created_at
FROM profiles
WHERE role = 'service_provider'
  AND id NOT IN (
    SELECT user_id FROM service_providers WHERE user_id IS NOT NULL
  );

-- Log the sync
DO $$
DECLARE
  synced_count integer;
BEGIN
  SELECT COUNT(*) INTO synced_count
  FROM profiles p
  WHERE p.role = 'service_provider'
    AND EXISTS (SELECT 1 FROM service_providers sp WHERE sp.user_id = p.id);
  
  RAISE NOTICE 'Service providers synced. Total active service providers in both tables: %', synced_count;
END $$;
