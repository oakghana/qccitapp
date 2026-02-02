# QCC IT App - Supabase Setup & Deployment Guide

## Quick Setup Instructions

### Step 1: Get Supabase Credentials

1. **Go to your Supabase Dashboard**: https://app.supabase.com/
2. **Select your project** (or create a new one if needed)
3. **Navigate to Settings** → **API**
4. **Copy the following values**:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Long JWT token (eyJhb...)
   - **service_role key**: Even longer JWT token (eyJhb...)

### Step 2: Update .env.local File

Open `.env.local` in the root directory and replace with your actual values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Initialize Supabase Database

Run the SQL scripts in order:

1. **In Supabase SQL Editor** (https://app.supabase.com/project/_/sql):
   - Run `scripts/001_create_schema.sql`
   - Run `scripts/013b_comprehensive_update.sql`
   - Run `scripts/022_add_assigned_to_columns.sql`
   - Run `scripts/040_create_system_settings.sql`

2. **Create Admin User**:
   - Run `scripts/003_create_admin_user.sql`

### Step 4: Build & Test

Run these commands in order:

```bash
# Install dependencies (if not already done)
pnpm install

# Build the application
pnpm build

# Start production server
pnpm start
```

Or for development:

```bash
# Start development server
pnpm dev
```

---

## Verification Checklist

### ✅ Test CRUD Operations

After starting the app, verify these operations work:

#### 1. **Authentication (Create/Read)**
- [ ] Navigate to `/create-account`
- [ ] Create a new user account
- [ ] Login with credentials
- [ ] Verify dashboard loads

#### 2. **Service Tickets (Full CRUD)**
- [ ] **Create**: Submit a new service ticket
- [ ] **Read**: View ticket list
- [ ] **Update**: Assign ticket to IT staff
- [ ] **Delete**: Delete a test ticket

#### 3. **Devices (Full CRUD)**
- [ ] **Create**: Add a new device
- [ ] **Read**: View device inventory
- [ ] **Update**: Edit device details
- [ ] **Delete**: Remove a test device

#### 4. **Store Items (Full CRUD)**
- [ ] **Create**: Add new store item
- [ ] **Read**: View store inventory
- [ ] **Update**: Update stock quantities
- [ ] **Delete**: Remove test item

#### 5. **Repairs (Full CRUD)**
- [ ] **Create**: Submit repair request
- [ ] **Read**: View repair requests
- [ ] **Update**: Update repair status
- [ ] **Delete**: Cancel repair request

#### 6. **Notifications (Create/Read/Update)**
- [ ] Assign a ticket (creates notification)
- [ ] View notification bell
- [ ] Mark notification as read

#### 7. **Email Notifications**
- [ ] Configure SMTP in System Settings
- [ ] Test email sending
- [ ] Assign ticket with email notification

---

## Common Issues & Solutions

### Issue: "supabaseUrl is required"
**Solution**: 
- Make sure `.env.local` exists in the root directory
- Verify all three Supabase variables are set
- Restart the dev server completely (Ctrl+C, then `pnpm dev`)

### Issue: "Invalid JWT token"
**Solution**:
- Double-check you copied the full anon key and service role key
- Make sure there are no extra spaces or line breaks
- Keys should start with `eyJhbGciOiJIUzI1NiI...`

### Issue: "relation does not exist"
**Solution**:
- Run all database migration scripts in Supabase SQL Editor
- Verify scripts ran without errors
- Check that tables exist in Database → Tables

### Issue: Build fails with type errors
**Solution**:
```bash
# Clear cache and rebuild
pnpm run build --no-cache
```

### Issue: RLS (Row Level Security) blocking queries
**Solution**:
- Run `scripts/018_disable_all_rls.sql` (development only)
- Or properly configure RLS policies

---

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Push code to GitHub**
2. **Import to Vercel**: https://vercel.com/new
3. **Add environment variables** in Vercel project settings
4. **Deploy**

### Option 2: Self-hosted

```bash
# Build production bundle
pnpm build

# Start production server
pnpm start

# Or use PM2 for process management
pm2 start npm --name "qcc-it-app" -- start
```

---

## Database Backup

**IMPORTANT**: Always backup your database before running migrations:

```bash
# In Supabase Dashboard:
# Settings → Database → Backups → Create Backup
```

---

## Next Steps After Setup

1. **Configure System Settings** (Admin → System Settings):
   - SMTP for email notifications
   - Default notification preferences
   - System-wide configurations

2. **Create User Accounts**:
   - IT Staff members
   - Regional IT Heads
   - Service Desk staff
   - Regular users

3. **Setup Locations**:
   - Verify all locations in database match your structure
   - Update `lib/locations.ts` if needed

4. **Test All Features**:
   - Use the verification checklist above
   - Test with different user roles
   - Verify permissions work correctly

---

## Support

For issues or questions:
1. Check error logs in browser console (F12)
2. Check server logs in terminal
3. Verify database structure in Supabase
4. Check this guide's troubleshooting section
