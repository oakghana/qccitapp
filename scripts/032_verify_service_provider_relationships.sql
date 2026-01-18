-- Verification script to check and fix service provider relationships
-- This ensures service_providers.user_id is properly set for all active service providers

-- First, check if there are service providers without user_id
SELECT COUNT(*) as service_providers_without_user_id
FROM service_providers
WHERE user_id IS NULL AND is_active = true;

-- Check current service provider records
SELECT id, name, email, user_id, is_active
FROM service_providers
ORDER BY created_at DESC
LIMIT 10;

-- Check repair requests with service providers
SELECT COUNT(*) as repair_requests_with_provider
FROM repair_requests
WHERE service_provider_id IS NOT NULL;

-- Check if repairs are properly linked to service provider users
SELECT rr.id, rr.service_provider_id, rr.service_provider_name, sp.id, sp.name, sp.user_id
FROM repair_requests rr
LEFT JOIN service_providers sp ON rr.service_provider_id = sp.id
WHERE rr.service_provider_id IS NOT NULL
LIMIT 10;

-- Check profiles with service_provider role and their service provider record
SELECT p.id, p.username, p.full_name, p.role, sp.id as sp_id, sp.name, sp.user_id
FROM profiles p
LEFT JOIN service_providers sp ON sp.user_id = p.id
WHERE p.role = 'service_provider'
ORDER BY p.created_at DESC
LIMIT 10;
