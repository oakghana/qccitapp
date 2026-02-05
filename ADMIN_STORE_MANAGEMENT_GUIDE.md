# Store Stock Management - Admin Features Guide

## Overview
Admins, IT Store Heads, and IT Heads now have comprehensive tools to manage store inventory by editing, merging, and deleting duplicate entries directly from the Store Summary Report page.

## Features Added

### 1. **Edit Store Items**
- Change item name or quantity
- Useful for correcting data entry errors
- All changes are logged in the audit trail with reason/notes
- Location-based access control ensures users can only edit items in their jurisdiction

### 2. **Merge Duplicate Entries**
- Automatically detects duplicate items with the same name but different SKUs
- Combine quantities from multiple entries into one consolidated item
- Example: Two "BARCODE SCANNER" entries (rows 94-95) can be merged, combining their stock levels
- Deleted source item, keeping target item with combined quantity
- Full audit trail tracks which items were merged and when

### 3. **Delete Store Items**
- Remove incorrect or obsolete entries
- Requires deletion reason (mandatory field for audit compliance)
- Prevents deletion if item has active requisitions or assignments
- Permanent action logged with full details

## How to Use

### Accessing Admin Features
1. Go to **Dashboard → Store Summary Report**
2. Look for the **MANAGE** column header (shown in amber/yellow background) - visible only to admins
3. Each row shows a **3-dot menu button** (⋮) for items you can manage

### Edit an Item
1. Click the 3-dot menu on any item row
2. Select **"Edit Item"**
3. Update the item name or quantity
4. Click **"Update Item"** to save
5. Changes are immediately reflected in the inventory

### Merge Duplicate Items
1. Click the 3-dot menu on any item that has duplicates
2. Select **"Merge Duplicate"**
3. Choose which duplicate item to merge into (target item)
4. Provide a merge reason (e.g., "Consolidating similar items")
5. Click **"Merge Items"**
6. The source item is deleted, and quantities are combined in the target

**Example Scenario:**
- Item A: "BARCODE SCANNER" (SKU-1769180183274) with 289 units
- Item B: "BARCODE SCANNER" (SKU-1769180183274-WS) with 2 units
- After merge: One "BARCODE SCANNER" entry with 291 units total

### Delete an Item
1. Click the 3-dot menu on the item
2. Select **"Delete Item"**
3. Enter a reason for deletion (e.g., "Incorrect entry", "Item no longer used")
4. A confirmation dialog appears - click **"Delete"** to confirm
5. The item is permanently removed from inventory

## Authorization Levels

| Role | Can Edit | Can Merge | Can Delete |
|------|----------|-----------|-----------|
| Admin | ✅ All items | ✅ All items | ✅ All items |
| IT Store Head | ✅ Their location | ✅ Their location | ✅ Their location |
| IT Head | ✅ Head Office | ✅ Head Office | ✅ Head Office |
| Other Users | ❌ | ❌ | ❌ |

## Audit Trail & Compliance

All admin actions are logged:
- **Edit**: Records before/after values with reason
- **Merge**: Tracks source and target items, combined quantity
- **Delete**: Logs deleted item details and reason

View audit logs in: **Dashboard → System Settings → Audit Logs**

## Tips & Best Practices

✅ **Do's:**
- Merge duplicates with the same or very similar SKUs
- Delete clearly incorrect or obsolete entries
- Always provide a reason for any action
- Review duplicates before merging to ensure accuracy

❌ **Don'ts:**
- Delete items with active requisitions (system prevents this)
- Merge items from different categories without verification
- Delete without documenting the reason
- Make bulk changes without reviewing each item first

## Restrictions

The system prevents deletion if:
- Item has pending or approved transfer requests
- Item has active stock assignments not yet returned
- User doesn't have appropriate authorization for the item's location

In these cases, you must first resolve the requisitions/assignments before deletion.

## Troubleshooting

**Q: Can't see the MANAGE column?**
- You need Admin, IT Store Head, or IT Head role
- Contact system administrator if you believe this is incorrect

**Q: Can't merge two similar items?**
- They must have the same item name (case-insensitive)
- Check the exact spelling and try again

**Q: Error: "Cannot delete this item"?**
- The item likely has active requisitions or assignments
- Review and resolve those first, then retry deletion

**Q: Want to undo a merge or deletion?**
- Contact the admin - actions are logged but not reversible
- Restores may be possible from backups

---

**Need Help?** Contact your system administrator or check the audit logs for complete action history.
