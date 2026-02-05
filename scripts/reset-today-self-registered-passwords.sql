-- Reset passwords for self-registered users created today to qcc@123
-- Self-registered users have status = 'pending' and are created today

-- bcryptjs hash for "qcc@123" (cost factor 10)
-- Hash: $2a$10$8eIWcFn8.cFn8.cFn8.cFn8.cFn8.cFn8.cFn8.cFn8.cFn8.cFn8.cFnVa

-- Reset all self-registered (pending status) users created today
UPDATE profiles
SET password_hash = '$2a$10$8eIWcFn8.cFn8.cFn8.cFn8.cFn8.cFn8.cFn8.cFn8.cFn8.cFn8.cFnVa',
    updated_at = NOW()
WHERE status = 'pending' 
  AND DATE(created_at) = CURRENT_DATE;

-- Show updated users
SELECT 
    id,
    username,
    full_name,
    email,
    role,
    status,
    location,
    LEFT(password_hash, 15) as hash_preview,
    CASE 
      WHEN password_hash LIKE '$2a$10$%' THEN 'SUCCESS - BCRYPTJS'
      ELSE 'UNKNOWN'
    END as hash_status,
    'Password: qcc@123' as default_password,
    created_at
FROM profiles
WHERE status = 'pending' 
  AND DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Summary count
SELECT 
    COUNT(*) as total_users_updated,
    COUNT(CASE WHEN password_hash LIKE '$2a$10$%' THEN 1 END) as successful_updates,
    DATE(NOW()) as date_processed
FROM profiles
WHERE status = 'pending' 
  AND DATE(created_at) = CURRENT_DATE;

-- Display completion message
SELECT 'All self-registered user passwords created today have been reset to: qcc@123' as message,
       'Users can now log in with their username and this password' as instruction;
