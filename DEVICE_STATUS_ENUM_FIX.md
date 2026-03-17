# Device Status Enum Fix - Issue Resolution

## Problem Identified
When changing a device status to any value other than "Active" or "Retired", the system was throwing an error:
```
invalid input value for enum device_status: "repair"
```

## Root Cause
The database `devices` table has a `status` column defined as a PostgreSQL enum with specific valid values. The UI was attempting to use "repair" as a status value, but this enum value does not exist in the database schema.

**Valid Database Enum Values:**
- `active` - Device is operational
- `maintenance` - Device is under maintenance/repair
- `retired` - Device is no longer in use

## Solution Implemented

### 1. Backend Status Mapping
Changed the repair workflow to use the `maintenance` status instead of `repair`:
- When a user selects "Under Maintenance (Repair)" status, the backend stores it as `maintenance`
- A separate `repair_requests` and `repair_tasks` table tracks repair-specific details

### 2. UI Updates
Updated all components to reflect valid enum values:

**components/devices/device-inventory.tsx:**
- Status filter: Removed "repair" option, kept "Under Maintenance"
- Edit form: Changed "Under Repair" to "Under Maintenance (Repair)" to clarify the mapping

**components/devices/add-device-form.tsx:**
- Removed invalid "repair" option
- Changed "Under Repair" to "Under Maintenance"
- Kept only valid options: Active, Under Maintenance, Retired

**components/devices/repair-service-provider-dialog.tsx:**
- Updated labels to use "Under Maintenance" terminology
- Changed button text to "Send for Maintenance"
- Updated dialog title and descriptions

### 3. Workflow
When a device is marked as "Under Maintenance":
1. Device status changes to `maintenance` (valid enum value)
2. Repair dialog appears for service provider assignment
3. Repair task is created in `repair_requests` table
4. Service provider details are recorded
5. Device can later be returned to `active` status once repair is complete

## Files Modified
1. `/components/devices/device-inventory.tsx` - Updated status filter and edit form options
2. `/components/devices/add-device-form.tsx` - Removed invalid "repair" status option
3. `/components/devices/repair-service-provider-dialog.tsx` - Updated labels and terminology
4. `/app/api/devices/update-device/route.ts` - Already supports maintenance status
5. `/components/devices/device-inventory.tsx` - handleRepairConfirm uses "maintenance" status

## Testing Steps
1. Edit a device in the Device Inventory
2. Change status to "Under Maintenance (Repair)"
3. Repair dialog should appear without errors
4. Select service provider and confirm
5. Device should be successfully updated with maintenance status
6. Repair request should be created in the system

## Related Tables
- `devices` - Stores device master data with status enum
- `repair_requests` - Stores repair request details
- `repair_tasks` - Stores assigned repair tasks
- `service_providers` - Stores service provider information
- `repair_invoices` - Stores repair invoice details

This fix ensures the UI works with the database constraints while maintaining the repair management workflow.
