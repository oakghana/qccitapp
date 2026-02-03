# Store Management Workflow Documentation

## Overview
The QCC IT Store Management System tracks inventory across multiple locations, manages requisitions, and handles stock transfers between Central Stores and regional locations.

---

## 1. STOCK STRUCTURE

### Locations
- **Central Stores**: Main warehouse/storage facility
- **Regional Locations**: Head Office, Tema Port, Takoradi Port, Kumasi, Kaase, Tema Research, Volta Region, Western North, Western South, Eastern Region, BAR, etc.

### Database Tables
- `store_items`: Physical inventory at each location
- `store_requisitions`: Requests for items
- `stock_transactions`: History of all stock movements
- `stock_assignments`: Track who has what device/item
- `devices`: Individual device tracking (for computers, printers, etc.)

---

## 2. ADDING STOCK (Stock Receipt)

### How Stock is Added to Locations

#### A. Direct Addition (Store Manager/Admin)
**Location**: Store Inventory page → Add Item

**Process**:
1. Store manager navigates to Store Inventory
2. Clicks "Add New Item" button
3. Fills in form:
   - Item name
   - SKU/Part number
   - Category (Computers, Printers, Network Equipment, etc.)
   - Quantity
   - Unit (pcs, boxes, etc.)
   - Location (where item is stored)
   - Supplier (optional)
   - Unit price (optional)
4. Submits form

**Database Changes**:
```sql
-- Creates new record in store_items
INSERT INTO store_items (name, sku, category, quantity, unit, location, ...)
VALUES (...)

-- Records transaction
INSERT INTO stock_transactions (transaction_type, quantity, location_name, ...)
VALUES ('receipt', quantity, location, ...)
```

**Stock Level**: `+quantity` at selected location

---

## 3. STOCK REQUISITION WORKFLOW

### Types of Requisitions

#### A. Location-to-User Assignment (Within Same Location)
**Example**: IT staff at Head Office requests laptop for user at Head Office

**Workflow**:
1. **Request Creation** (Anyone at location)
   - User goes to Store Requisitions → New Requisition
   - Selects location (e.g., Head Office)
   - Items dropdown shows ONLY items available at Head Office
   - Enters:
     - Beneficiary/User name
     - Items needed (from that location's stock)
     - Purpose/notes
   - Submits requisition
   
   **Database**: Creates record in `store_requisitions` with status = 'pending'

2. **Approval** (Store Manager/IT Head)
   - Reviews requisition
   - Can approve, reject, or request modifications
   - Clicks "Approve"
   
   **Database**: Updates `store_requisitions` status = 'approved'

3. **Issuance** (Store Manager)
   - Opens approved requisition
   - Clicks "Issue Items"
   - Enters recipient details:
     - Recipient name
     - Office location
     - Room number
   - Submits issuance
   
   **Database Changes**:
   ```sql
   -- Deduct from location stock
   UPDATE store_items 
   SET quantity = quantity - issued_qty
   WHERE location = 'Head Office' AND id = item_id
   
   -- Create device entry (for trackable items)
   INSERT INTO devices (device_type, model, serial_number, assigned_to, location, ...)
   VALUES (...)
   
   -- Create assignment record
   INSERT INTO stock_assignments (item_id, assigned_to, office_location, ...)
   VALUES (...)
   
   -- Record transaction
   INSERT INTO stock_transactions (transaction_type, quantity, recipient, ...)
   VALUES ('issue', qty, recipient_name, ...)
   
   -- Update requisition
   UPDATE store_requisitions 
   SET status = 'issued', issued_to = recipient_name
   WHERE id = requisition_id
   ```
   
   **Stock Level**: 
   - Head Office stock: `-quantity` (deducted)
   - Device count: `+1` per item (tracked in devices table)

---

#### B. Central Stores to Location Transfer
**Example**: Regional office requests items from Central Stores

**Workflow**:
1. **Regional Requisition** (Regional IT Head)
   - Goes to Regional Store Requisitions → New Requisition
   - System automatically sets:
     - Source: Central Stores
     - Destination: Their location
   - Selects items from Central Stores inventory
   - Enters quantity needed
   - Submits request
   
   **Database**: Creates record in `store_requisitions` with requested_by_role = 'regional_it_head'

2. **IT Head Approval** (IT Head at Head Office)
   - Reviews regional requisition
   - Checks Central Stores stock availability
   - Approves if stock available
   
   **Database**: Updates status = 'approved'

3. **Stock Transfer** (Automatic on approval)
   
   **Database Changes**:
   ```sql
   -- Reduce Central Stores stock
   UPDATE store_items 
   SET quantity = quantity - transfer_qty
   WHERE location = 'Central Stores' AND name = item_name
   
   -- Increase Regional location stock (creates if doesn't exist)
   INSERT INTO store_items (name, category, quantity, location, ...)
   VALUES (item_name, category, transfer_qty, 'Kumasi', ...)
   ON CONFLICT (name, location) DO UPDATE
   SET quantity = store_items.quantity + transfer_qty
   
   -- Record transactions (2 records)
   -- 1. Transfer out from Central Stores
   INSERT INTO stock_transactions (transaction_type, quantity, location_name, ...)
   VALUES ('transfer_out', qty, 'Central Stores', ...)
   
   -- 2. Transfer in to Regional location
   INSERT INTO stock_transactions (transaction_type, quantity, location_name, ...)
   VALUES ('transfer_in', qty, 'Kumasi', ...)
   
   -- Update requisition
   UPDATE store_requisitions SET status = 'issued'
   ```
   
   **Stock Levels**:
   - Central Stores: `-quantity` (deducted)
   - Regional location (e.g., Kumasi): `+quantity` (added)

4. **Regional Issuance** (Regional IT Head)
   - Now items are in regional stock
   - Can issue to local users following Process A (location-to-user)

---

## 4. STOCK DEDUCTION SCENARIOS

### When Stock Decreases

| Action | Location | Deduction Type | Transaction Type |
|--------|----------|----------------|------------------|
| Issue to user within location | Same location | Direct deduction | `issue` |
| Transfer to another location | Source location | Transfer out | `transfer_out` |
| Damaged/Lost item | Any location | Adjustment | `adjustment` |
| Return to supplier | Any location | Adjustment | `return` |

### Example: Issuing 5 Laptops from Head Office to User

```javascript
// Before issuance
store_items: { location: 'Head Office', name: 'DELL LAPTOP', quantity: 35 }

// API Call: /api/store/issue-requisition
{
  requisitionId: "REQ-123",
  location: "Head Office",
  recipientName: "John Doe",
  officeLocation: "Finance Department",
  roomNumber: "203",
  items: [{ item_id: "laptop-001", quantity: 5 }]
}

// After issuance
store_items: { location: 'Head Office', name: 'DELL LAPTOP', quantity: 30 }
devices: [
  { model: 'DELL LAPTOP', serial: 'DELL-001', assigned_to: 'John Doe', location: 'Head Office' },
  { model: 'DELL LAPTOP', serial: 'DELL-002', assigned_to: 'John Doe', location: 'Head Office' },
  // ... 5 total devices created
]
stock_transactions: { 
  transaction_type: 'issue', 
  quantity: 5, 
  location_name: 'Head Office',
  recipient: 'John Doe'
}
```

---

## 5. STOCK ADDITION SCENARIOS

### When Stock Increases

| Action | Location | Addition Type | Transaction Type |
|--------|----------|---------------|------------------|
| Initial stock entry | Any location | New stock | `receipt` |
| Transfer from Central Stores | Destination location | Transfer in | `transfer_in` |
| Transfer from another location | Destination location | Transfer in | `transfer_in` |
| Return from user | Return location | Adjustment | `return` |

---

## 6. COMPLETE WORKFLOW EXAMPLES

### Example 1: New Stock Entry
```
1. Store Manager adds 50 HP Printers to Central Stores
   └─> Central Stores: +50 HP Printers
   └─> Transaction: 'receipt', qty=50, location='Central Stores'
```

### Example 2: Regional Office Needs Items
```
1. Kumasi Regional IT Head requests 10 HP Printers
   └─> Creates requisition (status='pending')

2. IT Head approves requisition
   └─> Status changes to 'approved'
   └─> Automatic transfer triggered:
       - Central Stores: -10 HP Printers
       - Kumasi: +10 HP Printers
       - Transaction: 'transfer_out' (Central Stores)
       - Transaction: 'transfer_in' (Kumasi)
   └─> Status changes to 'issued'

3. Kumasi IT Head issues 2 printers to local user
   └─> Kumasi: -2 HP Printers
   └─> Creates 2 device records assigned to user
   └─> Transaction: 'issue', qty=2, location='Kumasi', recipient='User Name'
```

### Example 3: Direct User Assignment (Same Location)
```
1. Admin User at Head Office requests laptop for employee
   └─> Creates requisition selecting from Head Office stock
   └─> Status: 'pending'

2. Store Manager approves
   └─> Status: 'approved'

3. Store Manager issues item
   └─> Enters recipient: "Jane Smith, HR Dept, Room 301"
   └─> Head Office: -1 Laptop
   └─> Creates device record: assigned_to='Jane Smith'
   └─> Transaction: 'issue', qty=1, location='Head Office'
   └─> Requisition status: 'issued'
```

---

## 7. KEY BUSINESS RULES

### Stock Availability Rules
1. **Location-Specific Stock**: Items can only be requested from the location where they physically exist
2. **Cannot Request from Empty Stock**: Requisition validation checks `quantity > 0`
3. **Cannot Over-Issue**: System prevents issuing more than available stock

### Transfer Rules
1. **Central Stores → Locations**: Requires IT Head approval
2. **Location → Location**: Currently requires going through Central Stores
3. **Same Location → User**: Requires Store Manager/Regional IT Head approval

### Assignment Rules
1. **Device Tracking**: Computers, printers, network equipment get individual device records
2. **Consumables**: Items like cables, accessories tracked by quantity only
3. **Assignment Record**: Every issuance creates a stock_assignment record with recipient details

---

## 8. REPORTS & TRACKING

### Available Reports

#### Stock Balance Report
Shows for each item:
- Opening balance
- Total receipts (items added)
- Total issues (items given out)
- Closing balance
- List of recipients (who received items)

**Example Report Output**:
```
Item: HP LASERJET PRINTER
Location: Head Office
Opening Balance: 10
Total Receipts: 5
Total Issues: 8
  - 3 to John Doe (Finance Dept)
  - 2 to Jane Smith (HR Dept)
  - 3 to Bob Wilson (IT Dept)
Closing Balance: 7
```

#### Device Allocation Summary
Shows:
- Total devices by type and location
- Who has each device
- Device status (in_use, available, under_repair)

---

## 9. API ENDPOINTS

### Core Store Operations

| Endpoint | Purpose | Who Can Access |
|----------|---------|----------------|
| `GET /api/store/items` | Get inventory list | Store Manager, IT Heads, Admin |
| `POST /api/store/items` | Add new stock | Store Manager, Admin |
| `PUT /api/store/update-item` | Update stock quantity | Store Manager, Admin |
| `POST /api/store/issue-requisition` | Issue items to user | Store Manager, Regional IT Head |
| `GET /api/store/stock-balance-report` | Generate report | IT Staff, IT Heads, Admin |
| `POST /api/store/regional-requisitions` | Request from Central Stores | Regional IT Head |
| `PUT /api/store/approve-requisition` | Approve requisition | IT Head, Store Manager |

---

## 10. LOCATION-BASED PERMISSIONS

### User Roles & Access

| Role | Can Add Stock | Can Approve | Can Issue | View Locations |
|------|---------------|-------------|-----------|----------------|
| Admin | All locations | All | All | All |
| IT Head | Central Stores | All | All | All |
| Store Manager | Central Stores | Central Stores | Central Stores | All |
| Regional IT Head | Own location | Own location | Own location | Own only |
| IT Staff | No | No | No | Own only |

---

## 11. STOCK LEVEL CALCULATION

### Real-Time Calculation
Current stock = Opening stock + Receipts - Issues

```sql
-- How system calculates current stock
SELECT 
  name,
  location,
  quantity AS current_stock,
  (SELECT COALESCE(SUM(quantity), 0) 
   FROM stock_transactions 
   WHERE transaction_type IN ('receipt', 'transfer_in') 
   AND item_id = store_items.id) AS total_receipts,
  (SELECT COALESCE(SUM(quantity), 0) 
   FROM stock_transactions 
   WHERE transaction_type IN ('issue', 'transfer_out') 
   AND item_id = store_items.id) AS total_issues
FROM store_items
WHERE location = 'Head Office'
```

---

## 12. IMPORTANT NOTES

### Data Integrity
- All stock movements create transaction records (audit trail)
- Stock levels updated atomically (within database transaction)
- Device assignments linked to original stock items
- Cannot delete items with active assignments

### Stock Synchronization
- Location names must match exactly (use location normalization)
- System handles variations: "head_office", "Head Office" → standardized
- Central Stores is the master inventory source

### Future Enhancements
- Direct location-to-location transfers (without Central Stores)
- Automatic reorder points and alerts
- Barcode scanning for issuance
- Mobile app for inventory checks
- Stock taking/reconciliation module

---

## QUICK REFERENCE

### Adding Stock to Central Stores
1. Store Inventory → Add New Item
2. Fill details, set location = "Central Stores"
3. Submit

### Transferring from Central Stores to Regional Office
1. Regional IT Head: Regional Requisitions → New Requisition
2. Select items from Central Stores
3. Submit request
4. IT Head approves
5. Stock automatically transfers

### Issuing to User from Local Stock
1. Store Requisitions → New Requisition
2. Select your location
3. Choose items (only your location's stock shown)
4. Submit
5. Store Manager approves
6. Store Manager issues with recipient details
7. Stock deducted, device created, user assigned

---

**Last Updated**: February 3, 2026
**System Version**: 1.0
**Contact**: IT Department - QCC
