-- Create function to verify password using pgcrypto
CREATE OR REPLACE FUNCTION verify_password(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  -- Get the stored password hash
  SELECT password_hash INTO stored_hash
  FROM profiles
  WHERE username = p_username AND status = 'approved';
  
  -- If no user found, return false
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Compare the provided password with the stored hash
  RETURN (stored_hash = crypt(p_password, stored_hash));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
