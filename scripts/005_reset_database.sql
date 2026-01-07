-- Reset all data except user profiles
-- This script clears all transactional data but preserves user accounts

-- Clear all repair requests
TRUNCATE TABLE repair_requests CASCADE;

-- Clear all service tickets  
TRUNCATE TABLE service_tickets CASCADE;

-- Clear all store requisitions
TRUNCATE TABLE store_requisitions CASCADE;

-- Clear all store items
TRUNCATE TABLE store_items CASCADE;

-- Clear all devices
TRUNCATE TABLE devices CASCADE;

-- Clear all service providers
TRUNCATE TABLE service_providers CASCADE;

-- Clear all notifications
TRUNCATE TABLE notifications CASCADE;

-- DO NOT clear profiles table - preserve user accounts
-- Profiles table will remain untouched with all login credentials intact

SELECT 'Database reset complete. User profiles preserved.' as status;
