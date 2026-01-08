# IT Device Tracker - Setup Guide

## Initial Setup

### 1. Setup Admin Account

Visit `/setup-admin` in your browser to initialize the admin account.

**Default Admin Credentials:**
- Username: `ohemengappiah@qccgh.com`
- Password: `ghana@1`
- Role: Admin

This will:
- Create a fresh admin account in the database
- Hash the password using bcryptjs (10 salt rounds)
- Set the user as approved and active
- Verify the password works

### 2. Login

After setup, navigate to the home page (`/`) and login with the admin credentials.

### 3. Create Users

Once logged in as admin:
1. Navigate to "User Management" from the admin dashboard
2. Click "Create New User"
3. Fill in user details (username, email, role, location, etc.)
4. Submit the form
5. Users created by admin are auto-approved with default password: `qcc@123`

## Authentication System

The authentication system now uses:
- **bcryptjs** for password hashing (instead of PostgreSQL's pgcrypto)
- **Service Role Key** for database queries (bypasses RLS)
- **Direct SQL queries** through Supabase client
- **Session-based authentication** with cookies

### Password Hashing

All passwords are hashed using bcryptjs with 10 salt rounds:
```typescript
const hashedPassword = await bcrypt.hash(password, 10)
```

### Login Flow

1. User submits username and password
2. System queries database using service role key
3. bcrypt.compare() verifies password against stored hash
4. On success, user data is returned with redirect URL
5. Frontend stores user session

### Creating Users

Admin can create users with:
- Custom password (specified during creation)
- Default password: `qcc@123` (if not specified)

All admin-created users are automatically approved and active.

## Database

RLS (Row Level Security) is disabled on the profiles table to allow authentication queries to work properly.

## Troubleshooting

### Cannot Login

1. Visit `/setup-admin` to reset the admin account
2. Ensure you're using the correct credentials
3. Check browser console for error messages

### Password Not Working

The setup endpoint will show "Password Verified: true/false" - if false, there's an issue with the bcryptjs hashing.

### Database Errors

Ensure environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
