-- Reset all approved users' passwords to qcc@123 using bcryptjs-compatible hashes
-- This script is for documentation only - actual password hashing is done via the Node.js API

-- Drop old database functions that used pgcrypto
DROP FUNCTION IF EXISTS verify_password(TEXT, TEXT);
DROP FUNCTION IF EXISTS verify_user_password(TEXT, TEXT);
DROP FUNCTION IF EXISTS create_user_with_password(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_user_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS reset_user_password(TEXT, TEXT);

-- Note: Password hashing is now handled by bcryptjs in the Node.js API layer
-- All passwords should be hashed using: await bcrypt.hash(password, 10)
-- All password verification should use: await bcrypt.compare(password, hash)

-- Ensure all approved users have proper status
UPDATE profiles
SET status = 'approved',
    is_active = true,
    updated_at = NOW()
WHERE status = 'approved';

-- List all approved users (passwords will need to be reset via admin panel or API)
SELECT username, email, full_name, role, status, is_active
FROM profiles
WHERE status = 'approved'
ORDER BY username;
