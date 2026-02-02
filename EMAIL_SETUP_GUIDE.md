# Email Notification Setup Guide

## Gmail SMTP Configuration for QCC IT System

This guide will help you configure Gmail SMTP settings to enable email notifications for ticket assignments and other system events.

---

## Prerequisites

- A Gmail account (preferably a dedicated one for the system)
- Admin access to QCC IT System
- Google Account with 2-Factor Authentication enabled

---

## Step 1: Create a Google App Password

Since Google doesn't allow regular passwords for third-party apps, you need to create an "App Password":

### 1.1 Enable 2-Factor Authentication (if not already enabled)

1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "How you sign in to Google", click "2-Step Verification"
4. Follow the setup process if not already enabled

### 1.2 Generate App Password

1. Go to https://myaccount.google.com/apppasswords
   - Or navigate: Google Account → Security → 2-Step Verification → App passwords
2. You may need to sign in again
3. In the "App passwords" section:
   - **App name**: Enter "QCC IT System" or similar
   - Click "Create"
4. Google will generate a 16-character password
5. **IMPORTANT**: Copy this password immediately - you won't see it again!
   - Example: `abcd efgh ijkl mnop` (remove spaces when entering)

---

## Step 2: Configure SMTP Settings in QCC IT System

### 2.1 Access System Settings

1. Log in to QCC IT System as **Admin**
2. Navigate to: **Dashboard → Admin → System Settings**
3. Scroll to the **"Email Configuration"** section

### 2.2 Enter Gmail SMTP Settings

Fill in the following information:

| Field | Value | Example |
|-------|-------|---------|
| **SMTP Server** | `smtp.gmail.com` | `smtp.gmail.com` |
| **SMTP Port** | `587` (TLS) or `465` (SSL) | `587` |
| **SMTP Username** | Your full Gmail address | `itnotifications@qccghana.com` |
| **SMTP Password** | The App Password from Step 1 | `abcdefghijklmnop` |
| **Enable Email Notifications** | ✅ Enabled | Toggle ON |

### 2.3 Test the Configuration

1. In the "Test Email Configuration" section:
   - Enter your email address
   - Click **"Send Test Email"**
2. Check your inbox (and spam folder) for the test email
3. If successful, you'll see a green success message

**Common Issues:**
- ❌ **"Authentication failed"**: Double-check the App Password (no spaces)
- ❌ **"Connection refused"**: Verify SMTP server and port
- ❌ **Email not received**: Check spam/junk folder

### 2.4 Save Settings

1. Click the **"Save All Settings"** button at the top
2. Wait for confirmation message

---

## Step 3: Configure Ticket Assignment Notifications

When assigning tickets, IT Heads can now:

1. Open the **Assign Ticket** dialog
2. Select the staff member
3. Check **"Send email notification"** checkbox
4. The assigned staff will receive an email with:
   - Ticket number and title
   - Priority level
   - Due date (if set)
   - Assignment instructions
   - Direct link to view the ticket

---

## Email Templates

### Ticket Assignment Email

The system sends a professional HTML email with:

- **Subject**: "New Ticket Assigned: [Ticket Number]"
- **Content**:
  - Staff name personalization
  - Ticket details (number, title, priority, due date)
  - Assignment instructions
  - Direct link to dashboard
  - Color-coded priority badge

---

## IT Staff Location Filtering

### How Location-Based Assignment Works

When assigning tickets:

1. **Service Desk Head / IT Head**:
   - Can see ALL IT staff across all locations
   - Can filter by location using the dropdown
   - When a location is selected, only staff from that location are shown

2. **Regional IT Head**:
   - Can only see and assign to staff in their region
   - Automatic filtering based on their location

### Staff Visibility Rules

| User Role | Can Assign To |
|-----------|---------------|
| **Service Desk Head** | All IT staff (all locations) |
| **IT Head** | All IT staff (all locations) |
| **Regional IT Head** | IT staff in their region only |
| **Admin** | All IT staff (all locations) |

### Location Matching

The system uses flexible location matching:
- Exact match: "Accra" = "Accra"
- Contains: "Accra Head Office" includes "Accra"
- Case-insensitive matching

---

## Troubleshooting

### Email Not Sending

**Check 1: SMTP Settings Saved?**
- Verify settings are saved in System Settings
- Re-enter App Password if needed

**Check 2: Notification Checkbox**
- Ensure "Send email notification" is checked when assigning

**Check 3: Valid Email Address**
- Verify IT staff have valid email addresses in their profile

**Check 4: App Password**
- App Password must be 16 characters (no spaces)
- Regenerate if unsure

**Check 5: Gmail Security**
- Check Google Account → Security → "Less secure app access"
- Review "Recent security activity" for blocked attempts

### Staff Not Appearing in Assignment

**Check 1: User Role**
- Verify user has an IT-related role:
  - `it_staff`
  - `service_desk_staff`
  - `regional_it_head`
  - `it_head`

**Check 2: Location**
- Ensure user's location is set in their profile
- Check location spelling matches

**Check 3: User Status**
- User must be active (not disabled)

---

## Best Practices

### Gmail Account

1. **Use a dedicated email**: Create `itnotifications@qccghana.com`
2. **Don't use personal accounts**: Better for security and tracking
3. **Set up email forwarding**: Forward to IT Head for monitoring
4. **Regular password rotation**: Update App Password quarterly

### Email Notifications

1. **Use judiciously**: Only enable for important events
2. **Clear instructions**: Provide detailed assignment instructions
3. **Monitor delivery**: Check email reports in System Settings
4. **Spam folder**: Train staff to check and whitelist

### Security

1. **Protect App Password**: Never share or commit to code
2. **Revoke if compromised**: Delete and regenerate immediately
3. **Monitor access**: Review Google security logs
4. **Limit admin access**: Only admins should see SMTP settings

---

## Alternative Email Providers

While this guide focuses on Gmail, you can use other SMTP providers:

### Microsoft Outlook/Office 365
- **Server**: `smtp.office365.com`
- **Port**: `587`
- **Username**: Full email address
- **Password**: Account password (or App Password if 2FA enabled)

### SendGrid (Professional)
- **Server**: `smtp.sendgrid.net`
- **Port**: `587`
- **Username**: `apikey`
- **Password**: Your SendGrid API key

### Other Providers
Contact your email provider for SMTP settings.

---

## Support

For additional help:
1. Check system logs in Admin Dashboard
2. Review notification history
3. Contact system administrator
4. Check Google's SMTP documentation: https://support.google.com/mail/answer/7126229

---

**Last Updated**: February 2, 2026  
**Version**: 1.0
