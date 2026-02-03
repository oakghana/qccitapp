# Stock Issuing Permissions

## Who Can Issue Items from Stock

### 1. **Admin** (admin)
- Can issue items from ALL locations
- Can delete ANY requisition (pending, approved, or issued)
- Full control over all stock operations

### 2. **IT Store Head** (it_store_head)
- Can issue items from ALL locations (Central Stores + regional)
- Can approve and issue requisitions
- Can manage stock across all locations

### 3. **IT Head** (it_head)
- Can issue items from Head Office
- Can approve and issue requisitions from Head Office
- Can view all locations but can only issue from Head Office

### 4. **Store Manager** (Custom role or Admin sub-role)
- Can issue items from their assigned location
- Can approve and issue requisitions for their location

### 5. **Regional IT Head** (regional_it_head)
- Can issue items from their regional location ONLY
- Can approve requisitions for their location
- Cannot delete approved/issued requisitions (only admin can)

## Issuing Workflow

1. **Create Requisition**
   - User creates requisition from available stock
   - Status: `pending`
   - No stock deduction yet

2. **Approve Requisition**
   - Admin/IT Head/IT Store Head approves
   - Status changes to: `approved`
   - Stock still NOT deducted (waiting for actual issuance)

3. **Issue Items (SIV)**
   - Authorized user clicks "Issue Items (SIV)"
   - Fills in recipient details:
     - Recipient Name (required)
     - Office Location (required)
     - Room Number (optional)
     - Issue Notes (optional)
   - System:
     - Deducts stock from location
     - Creates device entries automatically (for hardware/equipment)
     - Records stock transaction
     - Updates requisition status to: `issued`

## Delete Permissions

### Requisitions
- **Pending/Rejected**: Can be deleted by creator or admin
- **Approved**: Can ONLY be deleted by admin
- **Issued**: Can ONLY be deleted by admin

### Devices
- **Any status**: Admin can delete
- **Unassigned**: IT Head, IT Store Head can delete
- **Assigned**: Only admin can delete

### Stock Items
- **Admin**: Can delete all items
- **IT Store Head**: Can delete items from any location
- **IT Head**: Can delete items from Head Office
- **Regional IT Head**: Can delete items from their location only

## Auto-Device Creation

When items are issued, devices are automatically created for these categories:
- Computers
- Printers
- Network Equipment
- Peripherals
- Accessories

Device fields auto-populated:
- Serial Number: Auto-generated (SKU-timestamp-sequence)
- Status: `in_use`
- Location: From requisition location
- Assigned To: Recipient name from issue form
- Office Location: From issue form
- Room Number: From issue form
- Notes: Includes requisition number and issue notes
