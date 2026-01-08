-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing functions to recreate them properly
DROP FUNCTION IF EXISTS verify_password(TEXT, TEXT);
DROP FUNCTION IF EXISTS verify_user_password(TEXT, TEXT);
DROP FUNCTION IF EXISTS create_user_with_password(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_user_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN);

-- Create verify_user_password function for login authentication
CREATE OR REPLACE FUNCTION verify_user_password(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_password_hash TEXT;
BEGIN
  -- Get password hash for active, approved user
  SELECT password_hash INTO v_password_hash
  FROM profiles
  WHERE username = p_username 
    AND status = 'approved' 
    AND is_active = true;
  
  -- If no user found or no password set, return false
  IF v_password_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verify password using bcrypt
  RETURN (v_password_hash = crypt(p_password, v_password_hash));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create user with hashed password
CREATE OR REPLACE FUNCTION create_user_account(
  p_username TEXT,
  p_email TEXT,
  p_full_name TEXT,
  p_role TEXT,
  p_location TEXT,
  p_phone TEXT,
  p_department TEXT,
  p_password TEXT,
  p_status TEXT DEFAULT 'pending',
  p_is_active BOOLEAN DEFAULT true
)
RETURNS TABLE(id UUID, username TEXT, email TEXT, full_name TEXT, role TEXT) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Insert user with hashed password
  INSERT INTO profiles (
    username,
    email,
    full_name,
    role,
    location,
    phone,
    department,
    password_hash,
    status,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    p_username,
    p_email,
    p_full_name,
    p_role,
    p_location,
    p_phone,
    p_department,
    crypt(p_password, gen_salt('bf')),
    p_status,
    p_is_active,
    NOW(),
    NOW()
  )
  RETURNING profiles.id INTO v_user_id;
  
  -- Return created user details
  RETURN QUERY
  SELECT 
    profiles.id,
    profiles.username,
    profiles.email,
    profiles.full_name,
    profiles.role
  FROM profiles
  WHERE profiles.id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset all existing approved users' passwords to qcc@123 for consistency
UPDATE profiles
SET password_hash = crypt('qcc@123', gen_salt('bf')),
    updated_at = NOW()
WHERE status = 'approved';

-- Test password verification for all approved users
DO $$
DECLARE
  v_user RECORD;
  v_can_login BOOLEAN;
BEGIN
  FOR v_user IN SELECT username FROM profiles WHERE status = 'approved' LOOP
    v_can_login := verify_user_password(v_user.username, 'qcc@123');
    RAISE NOTICE 'User % can login: %', v_user.username, v_can_login;
  END LOOP;
END $$;
