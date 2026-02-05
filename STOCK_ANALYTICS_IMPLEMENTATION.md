# Stock Management Analytics & Fixes

## Issues Fixed

### 1. **New Items Not Appearing in Central Stores Stock Summary**
**Root Cause:** When admins added new items, the default location was set to "Head Office" instead of "Central Stores", so items weren't appearing in the Central Stores stock summary report.

**Fix:** Modified `components/store/add-store-item-form.tsx` line 68 to default to "Central Stores" location for all admin stock additions.

```
Before: location: formData.location || user?.location || "Head Office"
After:  location: formData.location || "Central Stores"
```

## New Features Added

### 2. **Store Analytics Dashboard**
Created a new analytics page accessible at `/dashboard/store-analytics` with two tabs:

#### Tab 1: New Stock Additions
- View all items and quantities added to the system
- Displays: Item Name, Quantity, Category, Location, Date Added, Added By
- Helps track admin stock additions in real-time
- Automatically populated from `stock_transactions` table where `transaction_type = 'addition'`

#### Tab 2: All Transactions
- Complete history of stock movements across ALL locations
- Shows: Item Name, Transaction Type, Quantity, Location, Reference, Date
- Color-coded transaction types:
  - Green: Addition, Transfer In, Receipt
  - Red: Transfer Out, Issue, Reduction
  - Blue: Assignment
- Tracks all movements for complete audit trail

### 3. **Sidebar Navigation**
Added "Stock Analytics" link to the Store Management group in the sidebar for easy access.

## Database Requirements

### Tables Used
- `stock_transactions`: Records all stock movements and additions
  - Columns: id, item_name, transaction_type, quantity, location, reference_type, created_at, etc.

### API Endpoints Created
- `GET /api/store/stock-additions`: Fetches recent stock additions
- `GET /api/store/all-transactions`: Fetches all transactions across locations

## How It Works

1. **When an item is added via admin panel:**
   - Item is created with location = "Central Stores"
   - Transaction record is created with type = "addition"
   - Item appears in Stock Analytics dashboard immediately

2. **When stock is transferred or assigned:**
   - Transaction record is created with appropriate type
   - All movements are tracked in the All Transactions tab

3. **Stock Summary Report:**
   - Now correctly shows all items added to "Central Stores"
   - Queries store_items table filtered by location = "Central Stores"

## Next Steps (Optional Enhancements)

1. Add filters by date range in analytics
2. Add export to CSV functionality
3. Add real-time notifications for new stock additions
4. Add charts and graphs for visual analytics
