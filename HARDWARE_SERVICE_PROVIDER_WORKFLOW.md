# Hardware Service Provider Repair Workflow

## Overview
This document outlines the complete workflow for managing devices marked for repair and routing them to hardware service providers for work.

## Workflow Stages

### 1. **Device Marking for Repair**
- **Who**: IT Staff, Device Managers, IT Head
- **Where**: Device Inventory Page → Device Management
- **How**:
  - Mark a device status as "repair" in the device inventory
  - System automatically routes devices with "repair" status to the service provider workflow

### 2. **Devices Under Repair Dashboard**
- **Location**: `/dashboard/service-provider` → "Devices for Repair" tab
- **Visible To**: 
  - Hardware Service Providers (their assigned devices)
  - IT Head (all devices under repair)
  - Admin (all devices under repair)

### 3. **Service Provider Assignment**
- **Status**: `pending_assignment` → `assigned`
- **What Happens**:
  - Select a hardware service provider from the dropdown
  - System creates or updates a repair request record
  - Service provider receives a notification about the new device
  - Device status remains "repair" until completion

### 4. **Service Provider Dashboard View**
**Tabs Available**:
1. **Repair Tasks Tab**: Shows repair requests with detailed workflow
2. **Devices for Repair Tab**: Shows all devices awaiting service provider work

**Statistics Displayed**:
- Total Devices: Count of all devices marked for repair
- Pending Assignment: Devices awaiting service provider assignment
- Assigned: Devices with an assigned service provider
- In Repair: Devices currently being worked on
- Completed: Devices with repairs finished, ready for pickup

### 5. **Repair Status Lifecycle**

```
pending_assignment
    ↓
assigned (Service provider received notification)
    ↓
in_repair (Service provider working on device)
    ↓
completed (Repair finished, ready for pickup)
    ↓
returned (Device returned to owner)
```

### 6. **Service Provider Workflow**

**For Each Assigned Device, Service Provider Can**:

1. **Schedule Pickup**
   - Set scheduled pickup date and time
   - Add pickup notes
   - Status: `pickup_scheduled`

2. **Confirm Collection**
   - Confirm device was collected
   - Status: `collected`

3. **Update Repair Status**
   - Add repair notes
   - Record labor hours spent
   - Update parts used
   - Status: `in_repair` or `completed`

4. **Upload Invoice**
   - Upload repair invoice file
   - Break down costs:
     - Labor cost
     - Parts cost
     - Other charges
   - Specify invoice number and date
   - Status: Invoice pending approval

### 7. **Admin/IT Head Review**

**Dashboard**: `/dashboard/service-provider` or Admin Dashboard

**Actions Available**:
- View all devices under repair with service provider details
- Filter by:
  - Status (pending assignment, assigned, in repair, completed, returned)
  - Priority (low, medium, high, critical)
  - Service provider
  - Location

- View repair history and notes
- Approve/reject invoices
- Track repair costs vs. estimated costs
- Monitor SLA compliance

### 8. **Notification System**

**Service Provider Receives Notifications When**:
- New device assigned to them
- Device pickup scheduled
- Device collected
- Invoice approval status changes

**Admin/IT Head Receives Notifications When**:
- Device repair completed
- Invoice submitted for approval
- Repair deadline approaching

### 9. **Device Return Workflow**

After Repair Completion:
1. Device status changes to `completed`
2. Service provider schedules device return
3. Owner confirms device receipt
4. System records return date
5. Device status changes back to `active` (or other operational status)

## Key Tables

### devices
- **Columns**: id, status (repair), location, assigned_to, brand, model, serial_number, asset_tag, notes
- **Status**: "repair" indicates device needs service provider work

### repair_requests
- **Columns**: id, device_id, service_provider_id, status, issue_description, priority, estimated_completion, created_at, updated_at
- **Purpose**: Tracks repair details and service provider assignment

### repair_tasks
- **Columns**: id, task_number, device_id, service_provider_id, status, repair_notes, labor_hours, parts_used, actual_cost, created_at
- **Purpose**: Detailed repair work tracking by service provider

### repair_invoices
- **Columns**: id, repair_id, service_provider_id, invoice_number, total_amount, labor_cost, parts_cost, other_charges, status (pending/approved/rejected), created_at
- **Purpose**: Invoice management and approval workflow

### service_providers
- **Columns**: id, name, email, phone, specialization, location, is_active, user_id
- **Purpose**: Service provider information and contact details

## API Endpoints

### Get Devices Under Repair
```
GET /api/devices/under-repair?status=all&service_provider_id=xxx&location=xxx
```
Returns list of devices marked for repair with repair request details

### Create/Update Repair Request
```
POST /api/devices/under-repair
Body: {
  deviceId: string
  serviceProviderId: string
  issueDescription: string
  priority: "low" | "medium" | "high" | "critical"
}
```

### Get Service Provider Tasks
```
GET /api/repairs/tasks?service_provider_id=xxx
```
Returns repair tasks assigned to a service provider

### Update Repair Status
```
PATCH /api/repairs/update
Body: {
  id: string
  status: string
  work_notes?: string
  actual_hours?: number
  completed_at?: string
}
```

## Badge Counts

The system tracks badge counts for:
- **devicesUnderRepair**: Count of devices with "repair" status
- **Displays** on dashboard navigation for quick visibility

## Best Practices

1. **Priority Setting**: Use appropriate priority levels to ensure critical devices get faster turnaround
2. **Cost Tracking**: Always track estimated vs. actual costs for budget management
3. **Regular Updates**: Service providers should update repair status regularly
4. **Invoice Submission**: Submit invoices promptly after repair completion
5. **Communication**: Include detailed notes in all status updates

## Dashboard Views

### Service Provider Dashboard
- Shows devices assigned to them
- Shows current repair tasks with status
- Allows status updates and invoice uploads

### IT Head Dashboard
- Shows all devices under repair by location
- Tracks service provider assignment and progress
- Reviews costs and invoices

### Admin Dashboard
- System-wide repair management
- Service provider performance metrics
- Cost analysis and reporting

## Status Codes Reference

| Status | Meaning | Who Sets | Next Action |
|--------|---------|----------|-------------|
| pending_assignment | Awaiting provider assignment | System | Assign to provider |
| assigned | Provider assigned, awaiting pickup | Admin/IT Head | Schedule pickup |
| pickup_scheduled | Pickup date set | Service Provider | Collect device |
| collected | Device collected by provider | Service Provider | Start repair |
| in_repair | Provider actively working | Service Provider | Complete repair |
| completed | Repair finished | Service Provider | Return device |
| returned | Device returned to owner | Service Provider | Close ticket |
| cancelled | Repair cancelled | Admin/IT Head | Archive |

