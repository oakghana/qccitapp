# Bug Fix: Staff Dropdown Not Showing All Users

## Problem
The "Select Staff Member" dropdown in the "Assign Stock Item to Staff" dialog was not populating with users from the database.

## Root Causes
1. **Missing TypeScript Type Definition**: The `StaffMember` interface did not include the `is_active` property, causing TypeScript errors when the component tried to display the user status badges
2. **API Response Mapping**: The API was returning `is_active` field but the component interface wasn't expecting it
3. **Conditional Rendering Issue**: The badge display logic had redundant conditions that could have caused rendering issues

## Changes Made

### 1. Updated Component Interface (`components/store/assign-stock-to-staff.tsx`)
- Added `is_active?: boolean` to the `StaffMember` interface
- This allows the component to properly handle the active/inactive status from the API

### 2. Enhanced API Debugging (`app/api/staff/list/route.ts`)
- Added comprehensive logging at each step
- Improved error handling with specific error messages
- Changed select to use `select('*')` to fetch all fields including `is_active`
- Added result logging to verify data is being returned

### 3. Component Improvements (`components/store/assign-stock-to-staff.tsx`)
- Added detailed console logging in `loadStaffList()` function
- Simplified badge rendering logic from dual conditions to single ternary operator
- Added toast notifications for debugging and user feedback
- Improved error messages shown to users

## How It Works Now
1. When the assign dialog opens, `loadStaffList()` is called with `allUsers=true` parameter
2. The API fetches all records from `app_users` table including the `is_active` field
3. Data is properly mapped to the `StaffMember` interface with all required properties
4. Users are displayed in the dropdown with Active/Inactive badges
5. Users can be filtered, and new users can be created via the "Add New User" button

## Testing
To verify the fix works:
1. Open the "Assign Stock Item to Staff" dialog
2. Check the browser console for debug logs starting with `[v0]`
3. You should see `[v0] Fetched X users from app_users` where X is the count
4. The dropdown should now show all users with their status badges

## Files Modified
- `/app/api/staff/list/route.ts` - Enhanced API with better logging and error handling
- `/components/store/assign-stock-to-staff.tsx` - Added `is_active` to interface and improved debugging
