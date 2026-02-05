-- Script to reset passwords for users created today
-- This script updates the password for all users created on the current date
-- It does NOT affect users created before today
-- WARNING: This will set all new users' passwords to 'TempPass123'
-- Users will need to change their password after first login

-- First, let's see how many users will be affected
SELECT COUNT(*) as users_to_update
FROM profiles
WHERE DATE(created_at) = CURRENT_DATE;

-- Update the passwords for users created today
-- Using Supabase's password hashing function
UPDATE auth.users
SET encrypted_password = crypt('TempPass123', gen_salt('bf', 8))
WHERE id IN (
  SELECT id
  FROM profiles
  WHERE DATE(created_at) = CURRENT_DATE
);

-- Confirm the update
SELECT COUNT(*) as users_updated
FROM profiles
WHERE DATE(created_at) = CURRENT_DATE;

-- Note: After running this script, notify the users to change their password
-- The new password is: TempPass123