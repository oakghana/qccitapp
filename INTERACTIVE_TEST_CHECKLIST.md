# 🧪 Store Keeper Role - Interactive Testing Checklist

## Pre-Test Setup
- [ ] User account with role: `it_store_head` exists
- [ ] User account has location: `Head Office` (or other location)
- [ ] Central Stores has items with quantity > 0
- [ ] Head Office has items with quantity > 0
- [ ] Admin account available for approvals
- [ ] Browser dev console open (F12)

---

## 📋 Test Suite 1: Sidebar Navigation

### Test 1.1: Edit Profile Button Visibility
```
STEPS:
1. Login as it_store_head
2. Open sidebar
3. Scroll to bottom
4. Look for "Edit Profile" button with pencil icon

EXPECTED:
✅ Button is visible
✅ Button has blue hover effect
✅ Icon is visible

FAIL IF:
❌ Button missing
❌ Button says "Settings" instead
❌ No pencil icon
```

### Test 1.2: Edit Profile Button Functionality
```
STEPS:
1. With sidebar open
2. Click "Edit Profile" button
3. Wait for dialog to open

EXPECTED:
✅ Dialog opens
✅ Contains name field: "it_store_head user"
✅ Contains email field
✅ Save button works
✅ Dialog closes after save

FAIL IF:
❌ Dialog doesn't open
❌ Fields are empty
❌ Error on save
```

### Test 1.3: Store Management Menu
```
STEPS:
1. Look at sidebar menu
2. Find "Store Management" section
3. Count visible items

EXPECTED COUNT: 9 items
✅ Store Overview
✅ Store Inventory
✅ Store Stock Levels ← NEW
✅ Assign Stock to Staff
✅ Store Requisitions
✅ Stock Transfer Requests
✅ Stock Balance Report
✅ Stock Analytics ← NEW
✅ Assign IT Devices

FAIL IF:
❌ Less than 9 items
❌ Stock Levels missing
❌ Stock Analytics missing
❌ Any item has indentation glitch
```

### Test 1.4: Navigation Links Work
```
For each menu item, CLICK IT:
- [ ] Store Overview → Navigates, shows inventory
- [ ] Store Inventory → Shows list of items
- [ ] Store Stock Levels → Shows snapshot view
- [ ] Assign Stock to Staff → Shows assignment form
- [ ] Store Requisitions → Shows requisition list + button
- [ ] Stock Transfer Requests → Shows transfer list + NEW BUTTON
- [ ] Stock Balance Report → Shows report
- [ ] Stock Analytics → Shows analytics charts
- [ ] Assign IT Devices → Shows device assignment

EXPECTED: All navigate successfully
FAIL IF: Any link is broken or 404
```

---

## 📊 Test Suite 2: Dashboard

### Test 2.1: Dashboard Page Loads
```
STEPS:
1. Navigate to /dashboard
2. Wait for page to load

EXPECTED:
✅ Page loads in < 3 seconds
✅ No console errors
✅ Cards render properly

FAIL IF:
❌ Page hangs
❌ Error in console
❌ Stats show "..."
```

### Test 2.2: Dashboard Stats Display
```
STEPS:
1. Look at top stat cards

EXPECTED STATS VISIBLE:
✅ "Total Devices" - Shows number
✅ "Pending Requisitions" - Shows number
✅ "Active Repairs" - Shows number
✅ "Completed Repairs" - Shows number

EACH STAT CARD SHOULD:
✅ Have icon (Monitor, Clock, Wrench, CheckCircle)
✅ Have title text
✅ Have numeric value
✅ Have description text

FAIL IF:
❌ Stats are missing
❌ Values show "N/A"
❌ Console errors for stats API
```

### Test 2.3: Quick Action Buttons
```
STEPS:
1. Look for "Quick Actions" section
2. Count visible buttons

EXPECTED: 4 buttons for it_store_head
✅ "New Store Requisition" (📋 icon)
✅ "View Store Overview" (📦 icon)
✅ "Assign Stock to Staff" (👥 icon)
✅ "Stock Transfer Requests" (⚙️ icon)

BUTTON STYLING:
✅ Blue background/border on hover
✅ Icons visible and colored
✅ Text is readable

FAIL IF:
❌ Fewer than 4 buttons
❌ Generic buttons (green background)
❌ Wrong icons
❌ Buttons don't have text
```

### Test 2.4: Quick Action Navigation
```
CLICK each button:

1. "New Store Requisition" → /dashboard/store-requisitions
   ✅ Page loads
   ✅ "New Requisition" button visible
   
2. "View Store Overview" → /dashboard/store-overview
   ✅ Page loads
   ✅ Store data displays
   
3. "Assign Stock to Staff" → /dashboard/assign-stock
   ✅ Page loads
   ✅ Assignment form visible
   
4. "Stock Transfer Requests" → /dashboard/stock-transfer-requests
   ✅ Page loads
   ✅ "New Transfer Request" button visible ← NEW!

FAIL IF:
❌ Any page doesn't load
❌ 404 error
❌ Wrong page content
```

---

## 🔄 Test Suite 3: Stock Transfer Request Creation (NEW FEATURE)

### Test 3.1: Dialog Opens
```
STEPS:
1. Navigate to /dashboard/stock-transfer-requests
2. Click "New Transfer Request" button (top right)

EXPECTED:
✅ Dialog appears
✅ Title: "New Stock Transfer Request"
✅ Description text visible
✅ Modal is centered

FAIL IF:
❌ Button not found
❌ Dialog doesn't open
❌ Dialog has wrong title
```

### Test 3.2: Dialog Content
```
INSIDE DIALOG, verify:
✅ "Item from Central Stores" dropdown
✅ "Quantity to Request" number input (min: 1)
✅ "Notes (optional)" textarea
✅ "Cancel" button
✅ "Submit Request" button

FAIL IF:
❌ Any field missing
❌ Wrong field types
❌ Wrong button labels
```

### Test 3.3: Central Stores Items Load
```
STEPS:
1. Click on "Item from Central Stores" dropdown
2. Wait for items to load

EXPECTED:
✅ Dropdown shows items
✅ Each item shows: "Item Name — Available Qty"
✅ Shows multiple items
✅ Example: "Printer — 5 available"

ITEM DETAILS (below dropdown):
✅ Shows "Category: [category]"
✅ Shows "SKU: [sku]"
✅ Shows "Available: [quantity]"

FAIL IF:
❌ Dropdown says "Loading..." forever
❌ No items in dropdown
❌ "No items available..." message
❌ Details don't update when selecting
```

### Test 3.4: Item Selection & Quantity Validation
```
STEPS:
1. Select item: "Printer" (example, 5 available)
2. Click quantity field
3. Try entering: 0
4. Press Tab

EXPECTED ERROR:
✅ Red error message appears
✅ Message: "Please enter a valid quantity greater than 0"

STEPS (CONT):
5. Clear quantity
6. Enter: 10 (more than available)
7. Press Tab

EXPECTED ERROR:
✅ Red error message appears
✅ Message: "Central Stores only has 5 units available"

STEPS (CONT):
8. Clear quantity
9. Enter: 3 (valid)

EXPECTED:
✅ Error clears
✅ Value accepted

FAIL IF:
❌ No validation
❌ Wrong error messages
❌ Can submit with 0 or negative
❌ Can submit more than available
```

### Test 3.5: Form Submission - Success Path
```
STEPS:
1. Select item: "Printer"
2. Enter quantity: 2
3. Enter notes: "For office use"
4. Click "Submit Request" button
5. Wait for response

EXPECTED SUCCESS:
✅ Button changes to "Submitting..."
✅ Green success message appears
✅ Message: "Transfer request submitted successfully! Awaiting Admin approval."
✅ Dialog automatically closes after 2 seconds
✅ Page refreshes
✅ New request appears in "Pending" tab

REQUEST DETAILS:
✅ Shows "Printer" item name
✅ Shows quantity: "2"
✅ Status badge: "Pending" (gray)
✅ Requester name visible

FAIL IF:
❌ Error message instead of success
❌ API error in console
❌ Dialog doesn't close
❌ Request doesn't appear in list
❌ Button stays as "Submitting..."
```

### Test 3.6: Form Submission - Error Handling
```
STEPS:
1. Click "New Transfer Request" button
2. Click "Submit Request" WITHOUT selecting item
3. Wait for response

EXPECTED ERROR:
✅ Red error message appears
✅ Message: "Please select an item from Central Stores"
✅ Dialog stays open
✅ Form data preserved

STEPS (CONT):
4. Select item
5. Click Submit without quantity

EXPECTED ERROR:
✅ Red error message appears
✅ Message: "Please enter a valid quantity greater than 0"
✅ Dialog stays open

FAIL IF:
❌ API call made without item/quantity
❌ Wrong error message
❌ Dialog closes on error
❌ Form data lost
```

### Test 3.7: Dialog Cancel Button
```
STEPS:
1. Click "New Transfer Request" button
2. Enter some data (item + quantity)
3. Click "Cancel" button

EXPECTED:
✅ Dialog closes immediately
✅ No API call made
✅ No confirmation popup

FAIL IF:
❌ Dialog stays open
❌ Confirmation popup appears
❌ Form data submitted
```

---

## 📦 Test Suite 4: Store Requisitions

### Test 4.1: Create Requisition as Store Head
```
STEPS:
1. Navigate to /dashboard/store-requisitions
2. Click "New Requisition" button
3. Fill form:
   - Beneficiary: "Test Staff"
   - Destination: "Head Office"
   - Add item: "Printer" qty: 2
4. Submit

EXPECTED:
✅ Requisition created
✅ Shows in "Pending" tab
✅ Has badge: "Auto-Approved"
✅ Shows "Process Transfer" button

FAIL IF:
❌ Requisition shows as pending
❌ Doesn't show auto-approved badge
❌ Can't process transfer
```

---

## 👥 Test Suite 5: Assign Stock to Staff

### Test 5.1: Head Office Assignment Allowed
```
STEPS:
1. Navigate to /dashboard/assign-stock
2. Select item from: "Head Office"
3. Select item: "Keyboard" (or any item)
4. Enter staff name
5. Submit

EXPECTED:
✅ Assignment succeeds
✅ Success message appears
✅ Item removed from assignment list

FAIL IF:
❌ Error on submit
❌ Can't select items
❌ API error
```

### Test 5.2: Central Stores Assignment Blocked
```
STEPS:
1. Navigate to /dashboard/assign-stock
2. Select item from: "Central Stores"
3. Try to submit

EXPECTED:
✅ Error message appears
✅ Message: "Direct assignment from Central Stores is not permitted"
✅ Assignment blocked

FAIL IF:
❌ Can assign from Central Stores
❌ No error shown
```

---

## 🎨 Test Suite 6: UI/UX Verification

### Test 6.1: Color & Styling
```
BUTTONS (Store Head):
✅ Quick actions have BLUE hover (not green)
✅ Icons are BLUE colored
✅ Text is readable

SIDEBAR:
✅ Edit Profile has blue icon
✅ No menu items have indentation glitch
✅ All icons visible

DIALOG (Transfer Request):
✅ Modal has proper shadow
✅ Buttons are visible and styled correctly
✅ Input fields have proper focus states
✅ Error messages are RED
✅ Success messages are GREEN
```

### Test 6.2: Responsive Design
```
SCREEN SIZES TO TEST:
- [ ] Mobile (375px) - All buttons visible/clickable
- [ ] Tablet (768px) - Dialog shows properly
- [ ] Desktop (1024px+) - All features visible

EXPECTED:
✅ No horizontal scrolling
✅ All buttons tappable
✅ Text readable at all sizes
✅ Dialog centered on all sizes
```

### Test 6.3: Dark Mode
```
STEPS:
1. Toggle system dark mode (Settings)
2. Test all features

EXPECTED:
✅ Dashboard still visible
✅ Dialog contrast good
✅ Text readable
✅ Icons visible
✅ Colors consistent

FAIL IF:
❌ Text unreadable
❌ Icons disappear
❌ Poor contrast
```

---

## 🐛 Debugging Section

### If Tests Fail - Check These:

```javascript
// Check user role in console:
console.log(localStorage.getItem('user'))
// Should include: "role": "it_store_head"

// Check API responses:
// Network tab → /api/dashboard/stats
// Should return stats object with all fields

// Check transfer request API:
// POST /api/store/stock-transfer-requests
// Should return 200 with created request

// Check sidebar data:
// Should show 9 items in Store Management
```

### Console Checks:
- [ ] No errors in browser console (F12)
- [ ] No warnings related to auth
- [ ] No API 500 errors
- [ ] No missing component errors

---

## ✅ Final Sign-Off

### All Tests Passed?
- [ ] Yes - Ready to deploy ✅
- [ ] No - Document issues below:

**Issues Found**:
```
1. ___________________
2. ___________________
3. ___________________
```

**Tested By**: ___________________  
**Test Date**: ___________________  
**Browser**: ___________________  
**OS**: ___________________  

---

**Document Version**: 1.0  
**Last Updated**: March 23, 2026  
**Status**: Ready for QA Testing
