-- Create a function to reset user password
CREATE OR REPLACE FUNCTION reset_user_password(
  p_username TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the password hash for the user
  UPDATE profiles
  SET password_hash = crypt(p_new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE username = p_username;

  -- Return true if a row was updated
  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users (will be controlled by application logic)
GRANT EXECUTE ON FUNCTION reset_user_password(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_user_password(TEXT, TEXT) TO anon;
