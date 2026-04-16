# Department Head Dashboard Features

## Overview

Department heads now have access to a comprehensive, view-only dashboard that provides visibility into their department's IT operations and resources.

## Features Implemented

### 1. IT Stock Levels (View Only)
- **Location**: Department Head Dashboard → IT Stock Levels tab
- **Visibility**: View all current IT stock items with:
  - Item name and category
  - Current quantity available
  - Unit of measurement
  - Stock status indicators (In Stock / Low Stock / Out of Stock)
- **Read-Only**: No editing permissions - department heads can only view
- **API Endpoint**: `/api/store/stock-items`

### 2. Department Devices (View Only)
- **Location**: Department Head Dashboard → Department Devices tab
- **Visibility**: View all devices assigned to their department including:
  - Device name and type
  - Serial number and asset tag
  - Current status (Active / Repair / Maintenance / Retired)
  - Assigned staff member
  - Device location
- **Read-Only**: Cannot modify device information
- **API Endpoint**: `/api/devices/department-devices`

### 3. Service Desk Requests (View Only)
- **Location**: Department Head Dashboard → Service Desk Requests tab
- **Visibility**: View all repair/maintenance requests from their department:
  - Task number and device name
  - Issue description
  - Priority level (Low / Medium / High / Critical) with color coding
  - Request status
  - Assigned technician name
  - Request creation date
- **Read-Only**: Cannot modify request status or assignments
- **API Endpoint**: `/api/repairs/service-desk-requests?department=true`

### 4. Staff Management (Existing Feature)
- View all staff members in the department
- Search and filter capabilities
- View staff details and status

### 5. Account Settings (Existing Feature)
- View profile information (read-only: department, staff ID, name, email)
- Change password functionality

## Color-Coded Status Indicators

### Stock Status:
- **In Stock** (Green): More than 10 units available
- **Low Stock** (Yellow): 1-10 units available
- **Out of Stock** (Red): 0 units available

### Device Status:
- **Active** (Green): Device is operational
- **Repair** (Red): Device is under repair
- **Maintenance** (Yellow): Device is under maintenance
- **Retired** (Gray): Device has been retired

### Request Priority:
- **Critical** (Red): Urgent issue
- **High** (Orange): Important issue
- **Medium** (Yellow): Normal priority
- **Low** (Green): Low priority issue

## API Endpoints Created

1. **Stock Items API** - `/api/store/stock-items`
   - Method: GET
   - Returns: All central store stock items
   - Authentication: Required (department head)
   - Returns: { success: boolean, items: StockItem[] }

2. **Department Devices API** - `/api/devices/department-devices`
   - Method: GET
   - Returns: All devices in department head's department
   - Authentication: Required (department head)
   - Returns: { success: boolean, devices: DepartmentDevice[] }

3. **Service Desk Requests API** - `/api/repairs/service-desk-requests?department=true`
   - Method: GET
   - Returns: All service desk tickets for department head's department
   - Authentication: Required (department head)
   - Returns: { success: boolean, requests: ServiceDeskRequest[] }

## User Experience

### Dashboard Layout
- Clean, modern dark theme with professional styling
- Responsive design for desktop and mobile
- Glass-morphism effects for visual appeal
- Smooth transitions and hover effects
- Color-coded information for quick scanning

### Tab Navigation
- Overview: Pending IT form requests
- Staff Management: View and search staff
- IT Stock Levels: View item availability
- Department Devices: View device status
- Service Desk Requests: View repair requests
- Account Settings: Password management

### Read-Only Indicators
- All stock, device, and request views include "(View Only)" labels
- Prevents confusion about editing capabilities
- Clear, professional presentation

## Security Considerations

1. **Authentication**: All endpoints require user authentication
2. **Department Filtering**: Data is automatically filtered by department head's department
3. **No Modification Rights**: View-only endpoints don't accept POST/PUT/DELETE requests
4. **Data Privacy**: Department heads can only see their own department's data
5. **Role-Based Access**: Features only accessible to users with "department_head" role

## Integration Points

- **Database Tables**: 
  - `profiles` - For department information
  - `central_store_items` - For stock levels
  - `devices` - For device information
  - `service_desk_tickets` - For repair requests

- **Authentication**: Uses existing auth context and session management

- **UI Components**: Leverages existing shadcn/ui components for consistency

## Future Enhancements

- Export data to CSV/PDF
- Date range filtering for requests
- Search functionality within tabs
- Real-time notifications for critical issues
- Device assignment history
- Stock level trend charts
