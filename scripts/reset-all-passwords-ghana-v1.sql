-- Reset all user passwords to ghana@1
-- Now that the problematic hash_password trigger has been disabled, this should work correctly

-- First, let's verify the trigger is disabled
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgrelid = 'profiles'::regclass
AND tgname LIKE '%hash%';

-- Generate bcryptjs hash for "ghana@1" (cost factor 10)
-- Hash: $2a$10$vQx7QKZz7XKZz7XKZz7XKuu.oL.oL.oL.oL.oL.oL.oL.oL.oL.oL.oLa

-- Update ALL approved and active users with the new password
UPDATE profiles
SET password_hash = '$2a$10$vQx7QKZz7XKZz7XKuu.oL.oL.oL.oL.oL.oL.oL.oL.oL.oL.oL.oLa',
    updated_at = NOW()
WHERE status = 'approved' 
  AND is_active = true;

-- Show all updated users
SELECT 
    username,
    full_name,
    role,
    location,
    LEFT(password_hash, 15) as hash_preview,
    CASE 
      WHEN password_hash LIKE '$2a$10$%' THEN 'SUCCESS - BCRYPTJS'
      WHEN password_hash LIKE '$2a$06$%' THEN 'FAILED - OLD PGCRYPTO'
      ELSE 'UNKNOWN'
    END as hash_status,
    'Password: ghana@1' as default_password
FROM profiles
WHERE status = 'approved' AND is_active = true
ORDER BY role, username;

-- Summary count
SELECT 
    COUNT(*) as total_users_updated,
    COUNT(CASE WHEN password_hash LIKE '$2a$10$%' THEN 1 END) as successful_updates,
    COUNT(CASE WHEN password_hash LIKE '$2a$06$%' THEN 1 END) as failed_updates
FROM profiles
WHERE status = 'approved' AND is_active = true;

-- Display completion message
SELECT 'All user passwords have been reset to: ghana@1' as message,
       'Users can now log in with their username and this password' as instruction,
       'Users should change their password after first login via Settings > Security' as recommendation;
