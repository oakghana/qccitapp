# Device Repair Service Provider Feature

## Overview

When a device status is changed to "Under Repair" from the Device Inventory, the system now displays an interactive popup dialog that collects repair details and assigns a service provider to handle the device repair.

## User Workflow

1. **Edit Device** → Open the device edit dialog
2. **Change Status to "Under Repair"** → Select "Under Repair" from the Status dropdown
3. **Click Save Changes** → Instead of saving immediately, the **Repair Service Provider Dialog** appears
4. **Fill Repair Details**:
   - **Service Provider** (required) - Select from active service providers
   - **Issue Description** (required) - Describe what needs to be repaired
   - **Priority** (optional) - Select Low, Medium, High, or Critical
   - **Estimated Cost** (optional) - Enter repair cost estimate
5. **Click "Assign Service Provider & Save"** → System:
   - Updates device status to "repair"
   - Creates a repair ticket with the service provider
   - Displays success notification
   - Reloads device list

## Features

### Smart Dialog Behavior
- **Auto-triggered**: Only shows when status changes TO "Under Repair" (not on other status changes)
- **Device Information Display**: Shows device details (type, brand, model, serial number)
- **Provider Details**: Displays selected provider's contact info and location
- **Validation**: Ensures required fields are filled before submission
- **Error Handling**: Clear error messages for missing data or API failures

### Service Provider Management
- **Active Providers Only**: Dialog loads only active service providers
- **Provider Details**: Shows name, email, phone, specialization, and location
- **Dynamic Loading**: Loads providers when dialog opens
- **Fallback Messages**: Displays helpful messages if no providers are available

### Notification Integration
- **Success Notification**: Confirms device is marked for repair with provider name
- **Error Notifications**: Shows specific error messages if something fails
- **Warning Notifications**: Alerts for validation issues

## Components Created

### 1. `RepairServiceProviderDialog` Component
**Location**: `components/devices/repair-service-provider-dialog.tsx`

Features:
- Dialog UI for service provider assignment
- Form fields for repair details
- Service provider dropdown with dynamic loading
- Provider information display
- Comprehensive validation
- Notification integration

Props:
- `open` - Dialog visibility state
- `onOpenChange` - Handler for dialog state changes
- `device` - Device being sent for repair
- `onConfirm` - Handler called when confirmed
- `loading` - Loading state indicator

### 2. Device Inventory Integration
**Location**: `components/devices/device-inventory.tsx`

Modifications:
- Added repair dialog state management
- Added `handleRepairConfirm` handler for repair submission
- Modified `handleSaveDeviceEdit` to detect status change to "repair"
- Integrated repair dialog into render
- Added import for notification service

### 3. API Endpoints

#### Create Repair Ticket
**Route**: `POST /api/repairs/create`
**Location**: `app/api/repairs/create/route.ts`

Creates a repair task record with:
- Task number (auto-generated)
- Device information
- Issue description and priority
- Service provider assignment
- Estimated cost
- Status set to "assigned"

Request body:
```json
{
  "deviceId": "string",
  "deviceType": "string",
  "brand": "string",
  "model": "string",
  "serialNumber": "string",
  "issueDescription": "string",
  "priority": "low|medium|high|critical",
  "estimatedCost": "number",
  "serviceProviderId": "string",
  "createdBy": "string"
}
```

#### Fetch Service Providers
**Route**: `GET /api/service-providers?is_active=true`
**Location**: `app/api/service-providers/route.ts`

Fetches active service providers for assignment.

Query Parameters:
- `is_active` - Filter by active status (optional)

Response:
```json
{
  "providers": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "specialization": ["array"],
      "location": "string",
      "is_active": true
    }
  ],
  "count": "number"
}
```

## Database Requirements

The system expects these tables to exist:
- `service_providers` - Contains service provider information
- `repair_tasks` (or `repairs`) - Stores repair ticket records
- `devices` - Existing device records

Ensure these tables have the following columns:
- Service Providers: `id`, `name`, `email`, `phone`, `specialization`, `location`, `is_active`
- Repair Tasks: `id`, `task_number`, `device_id`, `device_type`, `brand`, `model`, `serial_number`, `issue_description`, `priority`, `status`, `service_provider_id`, `estimated_cost`, `assigned_by`, `assigned_date`, `created_at`, `updated_at`

## Testing Checklist

- [ ] Edit a device
- [ ] Change status from "Active" to "Under Repair"
- [ ] Repair dialog appears
- [ ] Service providers load correctly
- [ ] Can select a provider
- [ ] Provider details display below dropdown
- [ ] Fill in issue description
- [ ] Select priority
- [ ] Enter estimated cost (optional)
- [ ] Click "Assign Service Provider & Save"
- [ ] Success notification appears
- [ ] Device status changes to "repair"
- [ ] Device list reloads
- [ ] Repair ticket appears in repair management

## Error Scenarios

1. **No Service Providers**: Dialog shows message and disables save button
2. **Missing Validation**: Shows error and warning notification
3. **API Failure**: Displays error message and notification
4. **Network Issues**: Graceful error handling with retry option

## Future Enhancements

- Add repair status tracking
- Email notifications to service provider
- Automatic repair reminder notifications
- Device history tracking for repairs
- Repair completion workflow
