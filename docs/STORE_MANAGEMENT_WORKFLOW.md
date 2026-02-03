# QCC IT STORE MANAGEMENT WORKFLOW DOCUMENTATION

**Document Version:** 1.0  
**Date:** February 3, 2026  
**System:** QCC IT Device Tracking & Inventory Management System

---

## TABLE OF CONTENTS

1. Overview of Store Architecture
2. Stock Addition Process
3. Stock Requisition Workflow
4. Stock Issuance Process
5. Stock Transfer Between Locations
6. Transaction Types Reference
7. Database Tables Structure
8. User Role Permissions
9. Navigation Guide

---

## 1. OVERVIEW OF STORE ARCHITECTURE

The QCC IT Store Management System provides comprehensive inventory tracking across all QCC office locations. The system handles:

- Centralized inventory management at Central Stores
- Regional stock distribution to office locations
- Requisition workflow with approval process
- Automatic stock deduction upon issuance
- Device assignment tracking for equipment
- Audit trail for all stock movements

### Key Locations Supported:
- Central Stores (Main warehouse)
- Head Office
- Tema Port
- Takoradi Port
- Tema Research
- Tema Training School
- Kumasi
- Kaase
- Eastern Region
- Western North
- Western South
- Volta Region
- Central Region
- BAR

---

## 2. STOCK ADDITION PROCESS

### Purpose:
Add new items to the inventory at any location.

### Who Can Perform:
- Admin
- IT Store Head

### Steps:
1. Navigate to: **IT Operations → Store Inventory**
2. Click **"Add Item"** button
3. Fill in item details:
   - Item Name
   - SKU (Stock Keeping Unit)
   - Category (Computers, Printers, Network Equipment, etc.)
   - Quantity
   - Unit (pcs, box, etc.)
   - Unit Price
   - Location (select the warehouse/office)
   - Reorder Level
   - Supplier Information
4. Click **"Save"**

### System Action:
- New record created in `store_items` table
- Item becomes available for requisitions at that location

---

## 3. STOCK REQUISITION WORKFLOW

### Purpose:
Request items from inventory for use by staff.

### Who Can Perform:
- All users can create requisitions
- Store Manager approves/rejects

### STEP 1: Create Requisition

**Navigation:** IT Operations → Store Requisitions → New Requisition

**Form Fields:**
| Field | Description | Required |
|-------|-------------|----------|
| Requested By | Auto-filled with current user | Yes |
| Beneficiary/User | Person who will use the items | Yes |
| Location | Office location (filters available items) | Yes |
| IT Req. No. | Optional reference number | No |
| Notes/Purpose | Reason for requisition | No |
| Items | Select from available stock | Yes |

**Important:** When you select a location, ONLY items available at that location will appear in the dropdown. This ensures you can only request items that exist at your selected location.

### STEP 2: Submit Requisition

- Click **"Submit Requisition"**
- System creates record with status: **"Pending"**
- Store Manager receives notification

### STEP 3: Approval Process

**Navigation:** IT Operations → Store Requisitions → Pending Tab

**Store Manager Actions:**
- Review requisition details
- **Approve:** Status changes to "Approved"
- **Reject:** Status changes to "Rejected" (with reason)

---

## 4. STOCK ISSUANCE PROCESS

### Purpose:
Physically issue approved items to the requester and deduct from inventory.

### Who Can Perform:
- Admin
- IT Store Head
- Store Manager

### Steps:
1. Navigate to: **IT Operations → Store Requisitions**
2. Find the **"Approved"** requisition
3. Click **"Issue"** button
4. Enter issuance details:
   - Recipient Name (person collecting items)
   - Office Location
   - Room Number (optional)
   - Issue Notes

### System Actions (Automatic):

For EACH item in the requisition:

1. **Stock Deduction:**
   ```
   New Quantity = Current Quantity - Requested Quantity
   ```

2. **Update store_items table:**
   - Reduces quantity at the selected location

3. **Create Transaction Record:**
   - Type: "issue"
   - Records: item, quantity, recipient, date, performed_by

4. **Create Device Entry (for equipment only):**
   - Categories: Computers, Printers, Network Equipment, Peripherals
   - Auto-generates serial number
   - Links to assigned user

5. **Create Stock Assignment:**
   - Links item to recipient
   - Records office location and room number

6. **Update Requisition Status:**
   - Changes to "Issued"
   - Records issued_by, issued_date, issued_to

---

## 5. STOCK TRANSFER BETWEEN LOCATIONS

### Purpose:
Move stock from Central Stores to regional offices.

### Common Scenario:
Regional office needs items → Requests from Central Stores → Central Stores dispatches

### Who Can Perform:
- Regional IT Head (creates request)
- IT Store Head / Admin (approves and dispatches)

### Process Flow:

**STEP 1: Regional Request**
- Regional IT Head submits requisition specifying needed items
- Request goes to Central Stores queue

**STEP 2: Central Stores Approval**
- IT Store Head reviews request
- Verifies stock availability at Central Stores
- Approves the request

**STEP 3: Dispatch**
- Click "Dispatch" button
- System performs dual transaction:

| Location | Action | Stock Change |
|----------|--------|--------------|
| Central Stores | Transfer Out | DECREASES |
| Regional Office | Transfer In | INCREASES |

### Example:
```
Request: 10 Laptops from Central Stores to Tema Port

Before:
- Central Stores: 50 Laptops
- Tema Port: 5 Laptops

After Dispatch:
- Central Stores: 40 Laptops (-10)
- Tema Port: 15 Laptops (+10)
```

---

## 6. TRANSACTION TYPES REFERENCE

| Transaction Type | Description | Effect on Stock |
|-----------------|-------------|-----------------|
| receipt | New stock added to inventory | INCREASES (+) |
| issue | Items given to user/staff | DECREASES (-) |
| transfer_in | Items received from another location | INCREASES (+) |
| transfer_out | Items sent to another location | DECREASES (-) |
| adjustment | Manual stock correction | VARIES (+/-) |

---

## 7. DATABASE TABLES STRUCTURE

### store_items
Main inventory table containing all stock items.

| Column | Description |
|--------|-------------|
| id | Unique identifier |
| name | Item name |
| sku | Stock keeping unit code |
| category | Item category |
| quantity | Current stock level |
| unit | Unit of measurement |
| unit_price | Cost per unit |
| location | Storage location |
| reorder_level | Minimum stock threshold |

### store_requisitions
Tracks all item requests.

| Column | Description |
|--------|-------------|
| id | Unique identifier |
| requisition_number | Auto-generated REQ number |
| requested_by | User who created request |
| beneficiary | Person receiving items |
| location | Target location |
| items | JSON array of requested items |
| status | pending/approved/rejected/issued |
| approved_by | Manager who approved |
| issued_by | Person who issued |
| issued_to | Person who collected |

### stock_transactions
Audit trail for all stock movements.

| Column | Description |
|--------|-------------|
| id | Unique identifier |
| item_id | Reference to store_items |
| item_name | Name of item |
| transaction_type | receipt/issue/transfer_in/transfer_out |
| quantity | Number of items moved |
| location_name | Where transaction occurred |
| recipient | Who received (for issues) |
| office_location | Recipient's office |
| performed_by | User who performed action |

### stock_assignments
Tracks equipment assigned to users.

| Column | Description |
|--------|-------------|
| id | Unique identifier |
| item_id | Reference to store_items |
| device_id | Reference to devices table |
| item_name | Name of assigned item |
| assigned_to | User name |
| office_location | User's office |
| room_number | Room location |
| status | assigned/returned |

### devices
Equipment registry for trackable items.

| Column | Description |
|--------|-------------|
| id | Unique identifier |
| device_type | Type of equipment |
| brand | Manufacturer |
| model | Model name/number |
| serial_number | Unique serial number |
| status | in_use/available/repair |
| location | Current location |
| assigned_to | Current user |

---

## 8. USER ROLE PERMISSIONS

| Role | Add Stock | Create Requisition | Approve | Issue | Transfer |
|------|-----------|-------------------|---------|-------|----------|
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| IT Store Head | ✓ | ✓ | ✓ | ✓ | ✓ |
| IT Head | ✗ | ✓ | ✓ | ✗ | ✗ |
| Regional IT Head | ✗ | ✓ | Regional Only | ✗ | Request Only |
| IT Staff | ✗ | ✓ | ✗ | ✗ | ✗ |
| Staff/User | ✗ | ✓ | ✗ | ✗ | ✗ |

---

## 9. NAVIGATION GUIDE

### Main Menu: IT Operations

| Menu Item | Purpose |
|-----------|---------|
| Store Inventory | View/Add/Edit stock items |
| Store Requisitions | Create and manage requisitions |
| Regional Store Requisitions | Inter-location transfers |
| Store Overview | Dashboard with stock summary |
| Store Summary Report | Detailed stock reports |
| Stock Transfer Requests | Track pending transfers |

### Quick Actions

| Task | Navigation Path |
|------|-----------------|
| Add new item | IT Operations → Store Inventory → Add Item |
| Request items | IT Operations → Store Requisitions → New Requisition |
| Approve request | IT Operations → Store Requisitions → Pending Tab |
| Issue items | IT Operations → Store Requisitions → Approved Tab → Issue |
| Transfer stock | IT Operations → Regional Store Requisitions |
| View stock report | IT Operations → Store Summary Report |

---

## DOCUMENT END

**Prepared for:** Quality Control Company Limited  
**System:** QCC IT Device Tracking & Inventory Management  
**Contact:** IT Department

