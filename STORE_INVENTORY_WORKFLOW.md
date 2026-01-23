# QCC IT Device Tracker - Store Inventory Workflow

## Current Workflow (As Implemented)

### 1. STOCK REQUISITION WORKFLOW (Regional → Central Stores)

**Purpose:** Regional IT offices request items from Central Stores when they need inventory.

**Process:**
1. **Regional IT Head** creates a requisition via Store Management > Store Requisitions
   - Selects items from Central Stores catalog
   - Specifies quantities needed
   - System assigns requisition number (REQ-YYYYMMDD-XXX)
   - Status: `pending`

2. **IT Store Head / IT Head / Admin** reviews and approves the requisition
   - Views requisition details and requested items
   - Can approve full or partial quantities
   - System performs these actions:
     - Deducts approved quantity from Central Stores `store_items`
     - Creates `transfer_out` transaction at Central Stores
     - Creates OR updates `store_items` at regional location with approved quantity
     - Creates `transfer_in` transaction at regional location
     - Updates requisition status to `issued`

3. **Regional IT Head** can now see items in their location's inventory
   - Items appear in Store Overview for their location
   - Items appear in Stock Balance Report for their location
   - Items can be assigned to staff/users at that location

**API Endpoints:**
- `POST /api/store/requisitions` - Create requisition
- `GET /api/store/requisitions` - List requisitions
- `PATCH /api/store/approve-requisition` - Approve and issue items

**Database Tables:**
- `store_requisitions` - Tracks requisition requests
- `store_items` - Inventory at each location
- `stock_transactions` - Audit trail of all stock movements

---

### 2. STOCK TRANSFER REQUEST WORKFLOW (Regional → Central Stores)

**Purpose:** Alternative method for regional offices to request stock when their inventory is zero.

**Process:**
1. **Regional IT Head** creates transfer request from Store Management > Stock Transfer Requests
   - Can only request if local stock is zero
   - Specifies item and quantity needed
   - System checks Central Stores availability
   - System assigns request number (STR-XXXXX)
   - Status: `pending`

2. **IT Store Head / IT Head / Admin** approves the transfer request
   - Reviews Central Stores availability
   - Approves full or partial quantity
   - System performs these actions:
     - Deducts approved quantity from Central Stores `store_items`
     - Creates OR updates `store_items` at requesting location
     - Creates `transfer_out` transaction from Central Stores
     - Creates `transfer_in` transaction at requesting location
     - Updates request status to `approved`

3. **Regional IT Head** receives stock at their location
   - Items appear in their Store Overview
   - Items appear in their Stock Balance Report
   - Can assign items to users at their location

**API Endpoints:**
- `POST /api/store/stock-transfer-requests` - Create transfer request
- `GET /api/store/stock-transfer-requests` - List requests
- `PATCH /api/store/stock-transfer-requests` - Approve/reject request

**Database Tables:**
- `stock_transfer_requests` - Tracks transfer requests
- `store_items` - Updated at both locations
- `stock_transactions` - Records both transfer_out and transfer_in

---

### 3. STOCK ASSIGNMENT WORKFLOW (Regional Location → Individual User)

**Purpose:** Assign stock items from regional inventory to specific staff members.

**Process:**
1. **Regional IT Head** assigns items to staff from their location's inventory
   - Views items available at their location
   - Selects user to assign items to
   - Specifies quantity to assign
   - System validates sufficient stock exists

2. **System performs assignment:**
   - Deducts quantity from location's `store_items`
   - Creates assignment record linking user to items
   - Records transaction in `stock_transactions`
   - Status: `assigned`

3. **User receives assigned items:**
   - Items appear in user's assigned inventory
   - Location's stock level is reduced accordingly
   - Transaction is logged for audit trail

**Expected API:** (To be verified)
- `POST /api/store/assign-items` - Assign items to user
- `GET /api/store/user-assignments` - View user assignments

---

### 4. STOCK VISIBILITY & REPORTING

**Store Overview Dashboard:**
- Shows inventory summary cards for each location
- Displays: Total Items, Low Stock count, Out of Stock count
- **Fixed:** "Head Office" and "head_office" are now merged into single card
- Regional IT Heads see only their location + Central Stores
- Admin/IT Heads see all locations

**Stock Balance Report:**
- Shows Opening Balance, Receipts, Issues, Closing Balance
- Tracks stock movements by location and date range
- Uses `stock_transactions` table for accurate calculations
- **Fixed:** Now properly shows items issued to regional locations
- Can filter by location and date range
- Exports to CSV for procurement planning

**Regional IT Needs Analysis:**
- **Device Replacement:** Identifies aging devices needing replacement
- **Toner Requirements:** Calculates monthly/quarterly toner needs
- **Stock Replenishment:** Shows items below reorder level, calculates procurement quantities

---

## Key Database Tables & Fields

### store_items
- `id` (uuid) - Primary key
- `name` (text) - Item name
- `sku` (text, NOT NULL) - Stock keeping unit
- `siv_number` (text, NOT NULL) - Store issue voucher number
- `category` (text) - Item category
- `quantity` (integer) - Current stock quantity
- `reorder_level` (integer) - Minimum stock level
- `unit` (text) - Unit of measurement
- `location` (text) - Location code (kaase, Central Stores, Head Office, etc.)
- `supplier` (text) - Supplier name

### stock_transactions
- `id` (uuid) - Primary key
- `item_id` (uuid) - Reference to store_items
- `item_name` (text, NOT NULL) - Item name
- `transaction_number` (text, NOT NULL) - Unique transaction reference
- `transaction_type` (text) - transfer_in, transfer_out, issue, receipt, adjustment
- `quantity` (integer) - Transaction quantity
- `location_name` (text) - Location where transaction occurred
- `reference_number` (text) - Related requisition/request number
- `performed_by_name` (text, NOT NULL) - Person who performed transaction
- `notes` (text) - Additional information

### store_requisitions
- `id` (uuid) - Primary key
- `requisition_number` (text) - Unique requisition reference
- `location` (text) - Requesting location
- `items` (jsonb) - Array of requested items with quantities
- `status` (text) - pending, approved, issued, rejected
- `requested_by` (text) - Person who created requisition
- `approved_by` (text) - Person who approved
- `issued_by` (text) - Person who issued items

### stock_transfer_requests
- `id` (uuid) - Primary key
- `request_number` (text) - Unique request reference
- `item_id` (uuid) - Item being requested
- `requested_quantity` (integer) - Quantity requested
- `approved_quantity` (integer) - Quantity approved (can be partial)
- `requesting_location` (text) - Location requesting stock
- `status` (text) - pending, approved, rejected
- `requested_by` (text) - Person who requested
- `approved_by` (text) - Person who approved

---

## Recent Fixes Applied

1. **Fixed Regional Stock Visibility (Kaase, Tema Port, Kumasi):**
   - Added missing `siv_number` field when creating items at regional locations
   - Stock transfer requests now properly create items with all required fields
   - Regional locations now see issued items in Store Overview and Stock Balance Report

2. **Fixed Duplicate Head Office Cards:**
   - Merged "Head Office" and "head_office" into single unified card
   - Normalizes location names for consistent display

3. **Fixed Transaction Logging:**
   - Added `transaction_number` and `performed_by_name` required fields
   - Creates both transfer_out (from Central) and transfer_in (to Regional) transactions
   - Stock Balance Report now uses transactions for accurate reporting

4. **Retroactive Fix for Kaase:**
   - Created script `/scripts/fix-kaase-stock-items.sql` to add missing items
   - Added 6 toner items (26A, 79A, 222A Black/Blue/Yellow, 205 Red) to Kaase inventory
   - Created corresponding stock transactions for audit trail

---

## Access Control

**Admin:**
- Full access to all locations
- Can approve requisitions and transfer requests
- Can view and manage all inventory

**IT Head:**
- Full access to all locations
- Can approve requisitions and transfer requests
- Oversees all IT operations

**IT Store Head:**
- Manages Central Stores inventory
- Approves requisitions and transfer requests
- Views all location inventories

**Regional IT Head:**
- Views only their location + Central Stores
- Creates requisitions and transfer requests
- Assigns items to users at their location
- Cannot see other regional locations

**User/Staff:**
- Views only items assigned to them
- No inventory management access

---

## Best Practices

1. **Always use Stock Requisitions or Stock Transfer Requests** - Never manually create items at regional locations
2. **Verify stock availability** - System checks Central Stores stock before allowing requests
3. **Use proper location codes** - Ensure consistency (kaase, Central Stores, Head Office, etc.)
4. **Track all movements** - All stock changes create audit trail transactions
5. **Regular stock takes** - Use Stock Balance Report to verify inventory accuracy
6. **Monitor reorder levels** - Regional IT Needs Analysis identifies items needing procurement

---

## Future Enhancements

1. Automated reorder notifications when stock falls below reorder level
2. Batch requisition approval for multiple requests
3. Stock transfer between regional locations (currently only Central → Regional)
4. Integration with device assignment workflow
5. Barcode/QR code scanning for stock management
6. Stock valuation and cost tracking
