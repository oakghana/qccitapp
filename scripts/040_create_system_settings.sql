-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  type VARCHAR(50) DEFAULT 'string',
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);

-- Insert default settings
INSERT INTO system_settings (key, value, type, description) VALUES
  ('company_name', '"Quality Control Company Limited"', 'string', 'Company name displayed in system'),
  ('system_email', '"system@qccghana.com"', 'string', 'System email address for notifications'),
  ('default_repair_deadline', '14', 'number', 'Default repair deadline in days'),
  ('backup_frequency', '24', 'number', 'Backup frequency in hours'),
  ('smtp_server', '"smtp.gmail.com"', 'string', 'SMTP server for email'),
  ('smtp_port', '587', 'number', 'SMTP port'),
  ('smtp_username', '"notifications@qccghana.com"', 'string', 'SMTP username'),
  ('smtp_password', '""', 'string', 'SMTP password (encrypted in production)'),
  ('enable_email_notifications', 'true', 'boolean', 'Enable email notifications'),
  ('email_delivery_reports', 'true', 'boolean', 'Track email delivery status'),
  ('sms_provider', '"Twilio"', 'string', 'SMS provider name'),
  ('sms_api_key', '""', 'string', 'SMS API key (encrypted in production)'),
  ('sms_from_number', '"+233XXXXXXXXX"', 'string', 'SMS from number'),
  ('sms_rate_limit', '100', 'number', 'SMS rate limit per hour'),
  ('enable_sms_notifications', 'true', 'boolean', 'Enable SMS notifications'),
  ('sms_delivery_reports', 'true', 'boolean', 'Track SMS delivery status'),
  ('session_timeout', '30', 'number', 'Session timeout in minutes'),
  ('otp_expiry', '5', 'number', 'OTP expiry in minutes'),
  ('max_login_attempts', '3', 'number', 'Maximum login attempts'),
  ('lockout_duration', '30', 'number', 'Account lockout duration in minutes'),
  ('password_min_length', '8', 'number', 'Minimum password length'),
  ('require_otp_for_login', 'true', 'boolean', 'Require OTP for login'),
  ('enable_audit_logging', 'true', 'boolean', 'Enable audit logging'),
  ('auto_lock_inactive_accounts', 'true', 'boolean', 'Auto-lock inactive accounts after 90 days')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view all settings
CREATE POLICY "Admins can view all settings" ON system_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings" ON system_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update settings
CREATE POLICY "Admins can update settings" ON system_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete settings
CREATE POLICY "Admins can delete settings" ON system_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Commit
COMMIT;
