-- Create function to update password
CREATE OR REPLACE FUNCTION update_password(
  p_username TEXT,
  p_new_password TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET 
    password_hash = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE username = p_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_password(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_password(TEXT, TEXT) TO anon;
