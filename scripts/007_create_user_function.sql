-- Create a function to create users with password hashing
CREATE OR REPLACE FUNCTION create_user_with_password(
  p_username TEXT,
  p_email TEXT,
  p_full_name TEXT,
  p_role user_role,
  p_location TEXT,
  p_phone TEXT,
  p_department TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  full_name TEXT,
  role user_role,
  status TEXT,
  location TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
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
    'approved',
    NOW(),
    NOW()
  )
  RETURNING 
    profiles.id,
    profiles.username,
    profiles.email,
    profiles.full_name,
    profiles.role,
    profiles.status,
    profiles.location;
END;
$$;
