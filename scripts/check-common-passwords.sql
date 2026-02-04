-- Check the most common password hashes in the profiles table
-- This will show us which password hashes are used by multiple users

SELECT 
    password_hash,
    COUNT(*) as user_count,
    ARRAY_AGG(username ORDER BY username) as usernames_sample
FROM profiles
WHERE is_active = true AND status = 'approved'
GROUP BY password_hash
ORDER BY user_count DESC
LIMIT 10;

-- Also show total count of unique password hashes
SELECT 
    COUNT(DISTINCT password_hash) as unique_password_hashes,
    COUNT(*) as total_active_approved_users
FROM profiles
WHERE is_active = true AND status = 'approved';
