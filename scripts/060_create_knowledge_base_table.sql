-- ============================================================
-- CREATE KNOWLEDGE BASE ARTICLES TABLE
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create knowledge base articles table
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  author VARCHAR(255),
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  tags TEXT[], -- Array of tags
  related_articles UUID[], -- Array of related article IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON knowledge_base_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_articles_published ON knowledge_base_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_kb_articles_created ON knowledge_base_articles(created_at DESC);

-- Disable RLS for now (consistent with other tables)
ALTER TABLE knowledge_base_articles DISABLE ROW LEVEL SECURITY;

-- Insert some initial articles
INSERT INTO knowledge_base_articles (title, content, category, author, is_featured, tags) VALUES
(
  'How to Reset Your Password',
  '## Password Reset Instructions

1. Go to the login page
2. Click on "Forgot Password"
3. Enter your email address
4. Check your email for the reset link
5. Click the link and create a new password

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

If you continue to have issues, please contact the IT Help Desk.',
  'Security',
  'IT Admin',
  true,
  ARRAY['password', 'login', 'security', 'reset']
),
(
  'Connecting to Office WiFi',
  '## WiFi Connection Guide

### For Windows:
1. Click the WiFi icon in the taskbar
2. Select "QCC-Corporate" network
3. Enter your network credentials
4. Click Connect

### For Mac:
1. Click the WiFi icon in the menu bar
2. Select "QCC-Corporate"
3. Enter your username and password
4. Click Join

### Troubleshooting:
- Make sure WiFi is enabled on your device
- Verify you are within range of an access point
- Contact IT if you cannot see the network',
  'Network',
  'IT Admin',
  true,
  ARRAY['wifi', 'network', 'connection', 'wireless']
),
(
  'Printer Setup and Troubleshooting',
  '## Printer Setup

### Adding a Network Printer:
1. Go to Settings > Devices > Printers & Scanners
2. Click "Add a printer or scanner"
3. Wait for the printer list to load
4. Select your department printer
5. Click "Add device"

### Common Issues:

**Printer Offline:**
- Check printer is powered on
- Verify network connection
- Restart the print spooler service

**Paper Jam:**
- Open all printer doors
- Gently remove jammed paper
- Check for small paper pieces
- Close all doors and restart print job

**Low Ink/Toner:**
- Submit a stock request for replacement toner
- Contact IT Store for immediate needs',
  'Hardware',
  'IT Admin',
  true,
  ARRAY['printer', 'hardware', 'printing', 'troubleshooting']
),
(
  'VPN Setup for Remote Work',
  '## VPN Installation and Setup

### Prerequisites:
- Company-approved laptop
- Active employee credentials
- IT approval for remote access

### Installation Steps:
1. Download VPN client from the internal portal
2. Run the installer as administrator
3. Restart your computer
4. Launch the VPN application
5. Enter server address: vpn.qcc.com
6. Login with your credentials

### Best Practices:
- Always connect to VPN before accessing company resources
- Disconnect VPN when not in use
- Never share VPN credentials
- Report any suspicious activity',
  'Network',
  'IT Admin',
  false,
  ARRAY['vpn', 'remote', 'security', 'network']
),
(
  'Microsoft Teams Tips and Tricks',
  '## Getting the Most from Microsoft Teams

### Quick Tips:
- Use @mentions to get someone''s attention
- Pin important chats for easy access
- Use keyboard shortcuts (Ctrl+E for search)
- Set your status to show availability

### Video Meetings:
- Test audio/video before meetings
- Use blur background for privacy
- Mute when not speaking
- Use the raise hand feature

### File Sharing:
- Share files directly in chat or channels
- Use the Files tab for organized storage
- Collaborate in real-time on documents
- Sync Teams files to your computer',
  'Software',
  'IT Admin',
  false,
  ARRAY['teams', 'software', 'collaboration', 'meetings']
);

SELECT 'Knowledge base table created with ' || COUNT(*) || ' articles' as result 
FROM knowledge_base_articles;
