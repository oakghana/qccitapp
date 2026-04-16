-- Check if service providers exist and have IDs
SELECT id, name, email FROM service_providers LIMIT 5;

-- Check repair_requests assigned to service providers
SELECT id, task_number, status, service_provider_id, service_provider_name, device_name FROM repair_requests WHERE service_provider_id IS NOT NULL LIMIT 10;

-- Check all repair_requests
SELECT COUNT(*) as total_repairs, COUNT(service_provider_id) as assigned_repairs FROM repair_requests;
