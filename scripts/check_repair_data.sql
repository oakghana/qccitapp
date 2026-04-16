-- Check repair_tasks table
SELECT COUNT(*) as repair_tasks_count FROM repair_tasks;
SELECT * FROM repair_tasks LIMIT 10;

-- Check devices table
SELECT COUNT(*) as devices_count FROM devices;
SELECT id, brand, model, status FROM devices LIMIT 10;

-- Check repair_requests table
SELECT COUNT(*) as repair_requests_count FROM repair_requests;
SELECT * FROM repair_requests LIMIT 10;

-- Check service_providers
SELECT COUNT(*) as service_providers_count FROM service_providers;
SELECT * FROM service_providers LIMIT 5;
