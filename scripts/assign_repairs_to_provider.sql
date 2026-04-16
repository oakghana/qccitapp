-- Assign all unassigned repair requests to NATHLAND COMPANY LIMITED service provider
UPDATE repair_requests
SET 
  service_provider_id = '808e21d0-8069-4687-8d40-5b5f609c0fb0',
  service_provider_name = 'NATHLAND COMPANY LIMITED',
  status = 'assigned',
  assigned_date = NOW(),
  updated_at = NOW()
WHERE service_provider_id IS NULL;

-- Verify the assignments
SELECT 
  COUNT(*) as total_assigned,
  status,
  service_provider_name
FROM repair_requests
WHERE service_provider_id = '808e21d0-8069-4687-8d40-5b5f609c0fb0'
GROUP BY status, service_provider_name;
