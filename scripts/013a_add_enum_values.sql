-- ============================================
-- STEP 1: ADD ENUM VALUES (Must be run separately)
-- Run this script first, then run 013b_comprehensive_update.sql
-- ============================================

-- Add new role values to user_role enum
-- Each ALTER TYPE must be in its own transaction

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'regional_it_head';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_accra';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_kumasi';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_takoradi';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_tema';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_sunyani';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'service_desk_cape_coast';

-- Note: After running this script, you MUST commit the transaction
-- before running the next script (013b_comprehensive_update.sql)
