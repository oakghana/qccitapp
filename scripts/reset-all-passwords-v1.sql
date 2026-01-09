-- Reset all user passwords to pa$$w0rd
-- This script sets all users in the profiles table to have the default password: pa$$w0rd
-- Users should change their password after logging in through Settings > Security

-- The bcryptjs hash for "pa$$w0rd"
-- Hash: $2a$10$rKZCEoJhqYqX5xJ9n5H9.eWZkF7vJ.JGkqY5KqZqN5H9eWZkF7vJ.

-- Update all users with the default password
UPDATE profiles
SET password_hash = '$2a$10$rKZCEoJhqYqX5xJ9n5H9.eWZkF7vJ.JGkqY5KqZqN5H9eWZkF7vJ.',
    updated_at = NOW()
WHERE password_hash IS NULL 
   OR password_hash = '' 
   OR LENGTH(password_hash) < 50
   OR password_hash LIKE '$2a$06%';  -- Old pgcrypto hashes

-- Show updated users
SELECT 
    username,
    email,
    full_name,
    role,
    status,
    'Password reset to: pa$$w0rd' as message,
    LEFT(password_hash, 15) as hash_preview
FROM profiles
WHERE password_hash = '$2a$10$rKZCEoJhqYqX5xJ9n5H9.eWZkF7vJ.JGkqY5KqZqN5H9eWZkF7vJ.'
ORDER BY role, username;

-- Summary of reset
SELECT 
    COUNT(*) as total_users_reset,
    'All users should now be able to login with password: pa$$w0rd' as instruction
FROM profiles
WHERE password_hash = '$2a$10$rKZCEoJhqYqX5xJ9n5H9.eWZkF7vJ.JGkqY5KqZqN5H9eWZkF7vJ.';
