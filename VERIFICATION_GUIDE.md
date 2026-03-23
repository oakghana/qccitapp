# Quick Verification Guide - Store Keeper Role (`it_store_head`)

## 🎯 Key Features to Test

### 1. Sidebar Navigation
**Login as: `it_store_head` user**

✅ **Must See**:
- Edit Profile button in footer
- Store Management section with these items:
  1. Store Overview
  2. Store Inventory
  3. Store Stock Levels
  4. Assign Stock to Staff
  5. Store Requisitions
  6. Stock Transfer Requests
  7. Stock Balance Report
  8. Stock Analytics
  9. Assign IT Devices

❌ **Should NOT See**:
- Admin-only sections
- Settings button (IT Staff only)

---

### 2. Dashboard Quick Actions
**Location: /dashboard**

✅ **Must See 4 Buttons**:
1. 📋 "New Store Requisition" → navigates to store-requisitions
2. 📦 "View Store Overview" → shows inventory
3. 👥 "Assign Stock to Staff" → opens assignment page
4. ⚙️ "Stock Transfer Requests" → shows transfers (NEW)

✅ **Stats Display**:
- Total Devices
- Pending Requisitions
- Active Repairs
- Completed Repairs

---

### 3. Create Stock Transfer Request (NEW)
**Location: /dashboard/stock-transfer-requests**

#### Expected Workflow:
1. Click "New Transfer Request" button (top right)
2. Dialog opens titled "New Stock Transfer Request"
3. **Item Selection**:
   - Shows dropdown of items from Central Stores
   - Displays: `Item Name — Available Quantity`
   - Shows item details: Category, SKU, Available count
4. **Quantity Input**:
   - Accept integer > 0
   - Max value = available quantity
   - Error if exceed available: "Central Stores only has X units available"
5. **Optional Notes**:
   - Textarea for request reason
6. **Submit**:
   - Button text: "Submit Request"
   - Shows success message: "Transfer request submitted successfully! Awaiting Admin approval."
   - Dialog closes after 2 seconds
   - New request appears in "Pending" tab

#### Expected States:
- ✅ Valid submission shows green success message
- ❌ Empty item selection shows error
- ❌ Quantity > available shows error
- ❌ Quantity ≤ 0 shows error

---

### 4. Store Requisitions (Existing)
**Location: /dashboard/store-requisitions**

✅ **Expected Behavior**:
- Create new requisition works
- IT Store Head requisitions show "Auto-Approved" badge
- Auto-approved requisitions can be "Process Transfer" (not approve/reject)
- Non-IT-Store-Head requisitions show full approval dialog

---

### 5. Assign Stock to Staff (Existing)
**Location: /dashboard/assign-stock**

✅ **Expected Behavior**:
- Can assign stock to staff
- Can only select from Head Office stock (not Central Stores)
- Central Stores shows error: "Direct assignment from Central Stores is not permitted"

---

### 6. Store Analytics & Snapshots (Existing)
**Location: /dashboard/store-analytics**

✅ **Expected Behavior**:
- Charts load correctly
- Data refreshes without errors

**Location: /dashboard/store-snapshot**

✅ **Expected Behavior**:
- Stock level data displays
- Inventory counts show correctly

---

## 🔍 Common Issues to Watch For

| Issue | Symptom | Fix |
|-------|---------|-----|
| Edit Profile not visible | Profile button missing in sidebar | Check role is `it_store_head` not `store_head` |
| Transfer Request button missing | Can't create new requests | Verify sidebar has "Stock Transfer Requests" link |
| Central Stores items empty | No items to select in dialog | Check Central Stores has items with quantity > 0 |
| Transfer fails with error | API error on submission | Verify user location and item availability |
| Stats not loading | Dashboard shows "..." | Check API location params are correct |

---

## 📱 UI Elements Added

### New Button
```
Location: /dashboard/stock-transfer-requests
Label: "New Transfer Request"
Icon: Plus (+)
Position: Top right, next to Refresh button
```

### New Dialog
```
Title: "New Stock Transfer Request"
Description: "Request stock from Central Stores to your location. Admin approval required."
Fields:
  - Item Selector (required)
  - Quantity Input (required)
  - Notes Textarea (optional)
Buttons:
  - Cancel
  - Submit Request (loading state: "Submitting...")
Success: Green message + 2s auto-close
Error: Red message + stays open
```

---

## 🔒 Authorization Rules Verified

| Action | Allowed Roles | Location Restriction |
|--------|---------------|----------------------|
| Create Requisition | Admin, IT Head, IT Store Head, Regional Head | Any location |
| Create Transfer Request | IT Store Head only | Request FROM Central Stores |
| Assign Stock | Admin, IT Store Head, Regional Head | Head Office only (Store Head) |
| Issue Items | All roles | From Central Stores or approved requisition |
| Approve Requisition | Admin only | All requisitions |
| Auto-Approve (IT Store Head) | Admin (when processing) | IT Store Head requisitions only |

---

## ✅ Final Sign-Off Checklist

- [ ] All sidebar items display correctly
- [ ] No console errors on dashboard
- [ ] Transfer request button appears
- [ ] Transfer request dialog opens
- [ ] Can submit valid transfer request
- [ ] Transfer appears in list as "Pending"
- [ ] Dashboard stats show without errors
- [ ] Quick action buttons work
- [ ] Edit Profile button works
- [ ] Store Analytics loads
- [ ] No missing imports or TypeScript errors

---

**Status**: All improvements deployed and ready for testing
**Last Updated**: March 23, 2026
**Modified Files**: 3 (sidebar, stock-transfer-requests page, dashboard-overview)
