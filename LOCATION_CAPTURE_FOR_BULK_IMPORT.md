# Location Capture for Bulk Device Import

## Overview

The bulk device import feature now captures and tracks the **location/region** where devices are being imported from. This ensures proper device assignment and enables audit trails for regional IT operations.

## Features Implemented

### 1. **Location Display Banner**
- A prominent green banner displays at the top of the import dialog
- Shows:
  - **Location**: The physical location where import is occurring
  - **Region**: The region/district information (if available)
  - Information that all devices will be assigned to this location

### 2. **Automatic Location Assignment**
- All imported devices are automatically assigned to the importing user's location
- Users cannot override this - the system enforces location-based assignment
- Location data is captured from the authenticated user's profile

### 3. **Location Metadata Lookup**
The API performs a database lookup to capture:
- **location_id**: UUID of the location from `locations` table
- **region_id**: UUID of the region from `regions` table
- **district_id**: UUID of the district from `districts` table
- **location_name**: Human-readable location name

### 4. **Import Summary Report**
After successful import, users see a detailed summary showing:
- **Location**: Where devices were imported
- **Region**: Associated region (if applicable)
- **Devices Imported**: Total count
- **Import Time**: Timestamp of import operation

### 5. **Comprehensive Audit Logging**
Each bulk import creates an audit log entry in the `audit_logs` table with:
```json
{
  "action": "bulk_device_import",
  "resource": "devices",
  "details": {
    "location": "Head Office",
    "location_id": "uuid...",
    "region_id": "uuid...",
    "district_id": "uuid...",
    "devices_imported": 5,
    "device_types": ["laptop", "desktop", "printer"]
  },
  "severity": "info"
}
```

## Technical Implementation

### Dialog Component (`bulk-device-import-dialog.tsx`)
- Added location banner with user's location and region
- Enhanced results display with import summary card
- Shows location assignment confirmation

### API Endpoint (`app/api/devices/bulk-import/route.ts`)
- Fetches location metadata from `locations` table
- Stores `location_id`, `region_id`, `district_id` with each device
- Creates audit log entries for all imports
- Logs location information for debugging

### Enhanced Logging
All operations include timestamps and location details:
```
[v0] Bulk import started - userLocation: Head Office, userRole: admin, Time: 2024-02-16T10:30:00Z
[v0] Location metadata - locationId: uuid..., regionId: uuid..., districtId: uuid...
[v0] Successfully imported 5 devices to location: Head Office at 2024-02-16T10:30:15Z
```

## User Experience Flow

1. **Opening Import Dialog**
   - Green banner appears showing user's location
   - User cannot change this location

2. **Uploading CSV**
   - File upload and validation occurs
   - Location info is automatically captured

3. **Successful Import**
   - Success message confirms location
   - Summary card shows:
     - Location where devices were imported
     - Region (if available)
     - Number of devices imported
     - Exact timestamp

4. **Audit Trail**
   - Admin can view audit logs showing:
     - Who imported what
     - When they imported
     - To which location/region
     - How many devices

## Database Changes

No database schema changes were made. The feature uses existing columns:
- `devices.location` - Text location name
- `devices.location_id` - UUID reference to locations table
- `devices.region_id` - UUID reference to regions table
- `devices.district_id` - UUID reference to districts table
- `audit_logs` - For tracking import operations

## Security & Governance

✅ **Location Enforcement**
- Users can only import to their own location
- API validates user has permission
- Location assignment is automatic and cannot be overridden

✅ **Audit Trail**
- All imports are logged with location metadata
- Timestamp recorded for every import
- User identity and role stored
- Detailed device information captured

✅ **Role-Based Access**
- Only admin, it_staff, regional_it_head can bulk import
- Location constraint applies to all roles

## Configuration

No configuration needed. The feature works automatically with:
- User's authenticated location from `profiles.location`
- User's authenticated region from `profiles.region`
- Location lookups from `locations` table

## Testing Checklist

- [ ] Verify location banner displays user's location
- [ ] Confirm imported devices have correct location_id
- [ ] Check audit logs are created for each import
- [ ] Verify timestamp accuracy in logs
- [ ] Test with different user locations
- [ ] Verify region information appears when available
- [ ] Check error handling for location lookup failures
- [ ] Confirm summary shows correct location information

## Future Enhancements

Possible improvements:
1. Add region/district filtering options to device inventory
2. Generate location-based import reports
3. Show location-based device statistics in dashboard
4. Add bulk import history viewer per location
5. Email notifications for bulk imports to regional managers
