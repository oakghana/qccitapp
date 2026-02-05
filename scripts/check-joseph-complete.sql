-- Check Joseph's complete profile information
SELECT 
    id,
    username,
    email,
    full_name,
    status,
    is_active,
    role,
    location,
    LEFT(password_hash, 30) as hash_preview,
    LENGTH(password_hash) as hash_length,
    created_at
FROM profiles
WHERE email = 'joseph.asante@qccgh.com' 
   OR username = 'joseph.asante@qccgh.com'
LIMIT 1;
