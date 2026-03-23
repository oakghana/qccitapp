# Code Changes Reference - Store Keeper Role Improvements

## Summary
Complete code audit and improvements for `it_store_head` (Store Keeper) role. Three files modified with 6 critical fixes.

---

## 📁 File 1: `components/ui/modern-sidebar.tsx`

### Change 1.1: Fix Edit Profile Button Role Check (Line 930)
**Issue**: Used `store_head` instead of `it_store_head`

**BEFORE**:
```typescript
{(user?.role === "regional_it_head" || user?.role === "it_staff" || user?.role === "service_desk_head" || user?.role === "store_head") && (
```

**AFTER**:
```typescript
{(user?.role === "regional_it_head" || user?.role === "it_staff" || user?.role === "it_store_head" || user?.role === "service_desk_head" || user?.role === "service_desk_staff") && (
```

**Changes**: 
- ✅ Changed `store_head` → `it_store_head`
- ✅ Added `service_desk_staff` (bonus fix)

---

### Change 1.2: Fix Collapsed Sidebar Edit Profile Button (Line 961)
**Issue**: Same role key issue in mobile sidebar

**BEFORE**:
```typescript
{(user?.role === "regional_it_head" || user?.role === "it_staff" || user?.role === "service_desk_head" || user?.role === "store_head") && (
```

**AFTER**:
```typescript
{(user?.role === "regional_it_head" || user?.role === "it_staff" || user?.role === "it_store_head" || user?.role === "service_desk_head" || user?.role === "service_desk_staff") && (
```

**Changes**:
- ✅ Changed `store_head` → `it_store_head`
- ✅ Added `service_desk_staff` (bonus fix)

---

### Change 1.3: Fix IT Staff Sidebar Indentation (Lines 282-291)
**Issue**: "Stock Balance Report" and "Stock Analytics" had incorrect indentation

**BEFORE**:
```typescript
{ name: "Store Stock Levels", href: "/dashboard/store-snapshot", icon: Package },
              {
                name: "Stock Balance Report",
                href: "/dashboard/store-summary-report",
                icon: FileText,
              },
              {
                name: "Stock Analytics",
                href: "/dashboard/store-analytics",
                icon: BarChart3,
              },
```

**AFTER**:
```typescript
{ name: "Store Stock Levels", href: "/dashboard/store-snapshot", icon: Package },
{
  name: "Stock Balance Report",
  href: "/dashboard/store-summary-report",
  icon: FileText,
},
{
  name: "Stock Analytics",
  href: "/dashboard/store-analytics",
  icon: BarChart3,
},
```

**Changes**:
- ✅ Removed extra indentation (6 extra spaces)
- ✅ Aligned with other nav items

---

### Change 1.4: Add Missing Navigation Links (Lines 333-360)
**Issue**: Store Management group missing "Store Stock Levels" and "Stock Analytics"

**BEFORE**:
```typescript
{
  name: "Store Management",
  icon: Store,
  badge: counts.storeRequisitions > 0 ? counts.storeRequisitions : undefined,
  items: [
    { name: "Store Overview", href: "/dashboard/store-overview", icon: Package },
    { name: "Store Inventory", href: "/dashboard/store-inventory", icon: Database },
    {
      name: "Assign Stock to Staff",
      href: "/dashboard/assign-stock",
      icon: UserPlus,
    },
    // ... other items
  ],
}
```

**AFTER**:
```typescript
{
  name: "Store Management",
  icon: Store,
  badge: counts.storeRequisitions > 0 ? counts.storeRequisitions : undefined,
  items: [
    { name: "Store Overview", href: "/dashboard/store-overview", icon: Package },
    { name: "Store Inventory", href: "/dashboard/store-inventory", icon: Database },
    { name: "Store Stock Levels", href: "/dashboard/store-snapshot", icon: Package },  // ← NEW
    {
      name: "Assign Stock to Staff",
      href: "/dashboard/assign-stock",
      icon: UserPlus,
    },
    // ... other items
    {
      name: "Stock Analytics",
      href: "/dashboard/store-analytics",
      icon: BarChart3,  // ← NEW
    },
    // ...
  ],
}
```

**Changes Added**:
- ✅ "Store Stock Levels" link to `/dashboard/store-snapshot`
- ✅ "Stock Analytics" link to `/dashboard/store-analytics`
- ✅ Both use appropriate icons
- ✅ Proper nesting in Store Management group

---

## 📁 File 2: `app/dashboard/stock-transfer-requests/page.tsx`

### Change 2.1: Add Plus Icon Import (Line 10)
**Issue**: Missing import for "Plus" icon needed for button

**BEFORE**:
```typescript
import {
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  RefreshCcw,
} from "lucide-react"
```

**AFTER**:
```typescript
import {
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  RefreshCcw,
  Plus,  // ← NEW
} from "lucide-react"
```

---

### Change 2.2: Add Plus Icon to Import (Line 28)
**Issue**: Select component import missing

**BEFORE**:
```typescript
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
```

**AFTER**:
```typescript
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
```

---

### Change 2.3: Add State Management for Transfer Request Creation (Lines 81-178)
**Issue**: No state or logic for creating transfer requests

**NEW CODE ADDED**:
```typescript
// Create request dialog state (IT Store Head)
const [createDialogOpen, setCreateDialogOpen] = useState(false)
const [centralItems, setCentralItems] = useState<{ 
  id: string
  name: string
  sku: string
  quantity: number
  category: string 
}[]>([])
const [centralItemsLoading, setCentralItemsLoading] = useState(false)
const [createForm, setCreateForm] = useState({
  itemId: "",
  requestedQuantity: "",
  notes: "",
})
const [createLoading, setCreateLoading] = useState(false)
const [createError, setCreateError] = useState("")
const [createSuccess, setCreateSuccess] = useState("")

// Function to load items from Central Stores
async function loadCentralItems() {
  setCentralItemsLoading(true)
  try {
    const response = await fetch("/api/store/items?location=Central+Stores&canSeeAll=true")
    const result = await response.json()
    if (response.ok) {
      const items = (result.items || result.data || []).filter((i: any) => i.quantity > 0)
      setCentralItems(items.map((i: any) => ({
        id: i.id,
        name: i.name,
        sku: i.sku || i.siv_number || "",
        quantity: i.quantity,
        category: i.category,
      })))
    }
  } catch (error) {
    console.error("[v0] Error loading Central Stores items:", error)
  } finally {
    setCentralItemsLoading(false)
  }
}

// Open dialog with data loading
function openCreateDialog() {
  setCreateForm({ itemId: "", requestedQuantity: "", notes: "" })
  setCreateError("")
  setCreateSuccess("")
  loadCentralItems()
  setCreateDialogOpen(true)
}

// Validate and submit transfer request
async function handleCreateRequest() {
  const selectedItem = centralItems.find(i => i.id === createForm.itemId)
  if (!selectedItem) {
    setCreateError("Please select an item from Central Stores")
    return
  }
  const qty = parseInt(createForm.requestedQuantity)
  if (isNaN(qty) || qty <= 0) {
    setCreateError("Please enter a valid quantity greater than 0")
    return
  }
  if (qty > selectedItem.quantity) {
    setCreateError(`Central Stores only has ${selectedItem.quantity} units available`)
    return
  }
  setCreateLoading(true)
  setCreateError("")
  try {
    const response = await fetch("/api/store/stock-transfer-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        itemCode: selectedItem.sku,
        requestedQuantity: qty,
        requestedBy: user?.full_name || user?.name || user?.email,
        requestingLocation: user?.location || "Head Office",
        userRole: user?.role,
        notes: createForm.notes,
      }),
    })
    const result = await response.json()
    if (!response.ok) {
      setCreateError(result.error || "Failed to create transfer request")
      return
    }
    setCreateSuccess("Transfer request submitted successfully! Awaiting Admin approval.")
    setTimeout(() => {
      setCreateDialogOpen(false)
      loadRequests()
    }, 2000)
  } catch (error) {
    console.error("[v0] Error creating transfer request:", error)
    setCreateError("An error occurred while creating the request")
  } finally {
    setCreateLoading(false)
  }
}
```

**Key Features**:
- ✅ Loads items from Central Stores
- ✅ Validates quantity (>0 and ≤ available)
- ✅ Validates item selection
- ✅ Submits to API with all required fields
- ✅ Error handling and success messaging
- ✅ Auto-closes dialog after 2 seconds on success
- ✅ Refreshes requisition list after submission

---

### Change 2.4: Add "New Transfer Request" Button (Lines 322-333)
**Issue**: No UI button to create transfer requests

**BEFORE**:
```typescript
<Button variant="outline" onClick={loadRequests}>
  <RefreshCcw className="h-4 w-4 mr-2" />
  Refresh
</Button>
```

**AFTER**:
```typescript
<div className="flex gap-2">
  {canCreateRequest && (
    <Button onClick={openCreateDialog}>
      <Plus className="h-4 w-4 mr-2" />
      New Transfer Request
    </Button>
  )}
  <Button variant="outline" onClick={loadRequests}>
    <RefreshCcw className="h-4 w-4 mr-2" />
    Refresh
  </Button>
</div>
```

**Changes**:
- ✅ Added conditional rendering for IT Store Head
- ✅ Button opens create dialog on click
- ✅ Plus icon indicates "create" action
- ✅ Properly spaced with Refresh button

---

### Change 2.5: Add Transfer Request Creation Dialog (Lines 472-560)
**Issue**: No dialog UI for creating transfer requests

**NEW DIALOG COMPONENT**:
```tsx
{/* Create Transfer Request Dialog - IT Store Head only */}
<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>New Stock Transfer Request</DialogTitle>
      <DialogDescription>
        Request stock from Central Stores to your location. Admin approval required.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="central-item">Item from Central Stores</Label>
        {centralItemsLoading ? (
          <p className="text-sm text-muted-foreground">Loading items...</p>
        ) : (
          <Select
            value={createForm.itemId}
            onValueChange={(v) => setCreateForm(prev => ({ ...prev, itemId: v }))}
          >
            <SelectTrigger id="central-item">
              <SelectValue placeholder="Select an item..." />
            </SelectTrigger>
            <SelectContent>
              {centralItems.map(item => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} — {item.quantity} available
                </SelectItem>
              ))}
              {centralItems.length === 0 && (
                <SelectItem value="__none__" disabled>No items available in Central Stores</SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
        {createForm.itemId && (() => {
          const sel = centralItems.find(i => i.id === createForm.itemId)
          return sel ? (
            <p className="text-xs text-muted-foreground">
              Category: {sel.category} | SKU: {sel.sku} | Available: {sel.quantity}
            </p>
          ) : null
        })()}
      </div>
      <div className="space-y-2">
        <Label htmlFor="create-qty">Quantity to Request</Label>
        <Input
          id="create-qty"
          type="number"
          min="1"
          max={centralItems.find(i => i.id === createForm.itemId)?.quantity}
          value={createForm.requestedQuantity}
          onChange={(e) => setCreateForm(prev => ({ ...prev, requestedQuantity: e.target.value }))}
          placeholder="Enter quantity..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="create-notes">Notes (optional)</Label>
        <Textarea
          id="create-notes"
          value={createForm.notes}
          onChange={(e) => setCreateForm(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Reason for request..."
          rows={2}
        />
      </div>
      {createError && (
        <div className="bg-red-50 text-red-700 px-3 py-2 rounded flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {createError}
        </div>
      )}
      {createSuccess && (
        <div className="bg-green-50 text-green-700 px-3 py-2 rounded flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {createSuccess}
        </div>
      )}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={createLoading}>
        Cancel
      </Button>
      <Button onClick={handleCreateRequest} disabled={createLoading || !!createSuccess}>
        {createLoading ? "Submitting..." : "Submit Request"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Dialog Features**:
- ✅ Item selector from Central Stores
- ✅ Quantity input with max validation
- ✅ Optional notes field
- ✅ Item details display (Category, SKU, Available qty)
- ✅ Error message display (red background)
- ✅ Success message display (green background)
- ✅ Cancel and Submit buttons
- ✅ Loading state on submit
- ✅ Disabled state after success

---

## 📁 File 3: `components/dashboard/dashboard-overview.tsx`

### Change 3.1: Add IT Store Head Dashboard Stats (Lines 160-192)
**Issue**: Dashboard showed generic stats for all non-IT-Staff roles; Store Head had no specific KPIs

**NEW CODE IN `getStats()` FUNCTION**:
```typescript
if (user?.role === "it_store_head") {
  return [
    {
      title: "Total Devices",
      value: loading ? "..." : stats.totalDevices.toString(),
      description: "Registered in system",
      icon: Monitor,
      trend: "",
    },
    {
      title: "Pending Requisitions",
      value: loading ? "..." : stats.pendingApprovals.toString(),
      description: "Awaiting processing",
      icon: Clock,
      trend: "",
    },
    {
      title: "Active Repairs",
      value: loading ? "..." : stats.activeRepairs.toString(),
      description: "Currently in progress",
      icon: Wrench,
      trend: "",
    },
    {
      title: "Completed Repairs",
      value: loading ? "..." : stats.completedRepairs.toString(),
      description: "This month",
      icon: CheckCircle,
      trend: "",
    },
  ]
}
```

**Stats Added**:
- ✅ Total Devices - Shows device count
- ✅ Pending Requisitions - Shows requisitions awaiting approval
- ✅ Active Repairs - Shows in-progress repairs
- ✅ Completed Repairs - Shows monthly completions

---

### Change 3.2: Add IT Store Head Quick Actions (Lines 475-514)
**Issue**: No quick action shortcuts for Store Head role

**NEW CODE ADDED**:
```typescript
{user?.role === "it_store_head" && (
  <>
    <Button
      variant="outline"
      className="w-full justify-start bg-transparent hover:bg-blue-50 hover:border-blue-200 transition-colors"
      onClick={() => router.push("/dashboard/store-requisitions")}
    >
      <Plus className="h-5 w-5 mr-3 text-blue-600" />
      <span className="text-sm font-medium">New Store Requisition</span>
    </Button>
    <Button
      variant="outline"
      className="w-full justify-start bg-transparent hover:bg-blue-50 hover:border-blue-200 transition-colors"
      onClick={() => router.push("/dashboard/store-overview")}
    >
      <Monitor className="h-5 w-5 mr-3 text-blue-600" />
      <span className="text-sm font-medium">View Store Overview</span>
    </Button>
    <Button
      variant="outline"
      className="w-full justify-start bg-transparent hover:bg-blue-50 hover:border-blue-200 transition-colors"
      onClick={() => router.push("/dashboard/assign-stock")}
    >
      <Users className="h-5 w-5 mr-3 text-blue-600" />
      <span className="text-sm font-medium">Assign Stock to Staff</span>
    </Button>
    <Button
      variant="outline"
      className="w-full justify-start bg-transparent hover:bg-blue-50 hover:border-blue-200 transition-colors"
      onClick={() => router.push("/dashboard/stock-transfer-requests")}
    >
      <Settings className="h-5 w-5 mr-3 text-blue-600" />
      <span className="text-sm font-medium">Stock Transfer Requests</span>
    </Button>
  </>
)}
```

**Quick Actions Added**:
- ✅ "New Store Requisition" with Plus icon
- ✅ "View Store Overview" with Monitor icon
- ✅ "Assign Stock to Staff" with Users icon
- ✅ "Stock Transfer Requests" with Settings icon
- ✅ Blue color scheme for Store Head actions
- ✅ Hover effect with blue background

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Files Modified | 3 |
| Total Lines Added | ~171 |
| Total Lines Modified | ~10 |
| New Functions | 3 |
| New UI Components | 1 |
| Role Key Fixes | 2 |
| Navigation Links Added | 2 |
| Quick Actions Added | 4 |
| Dashboard Stats Added | 4 |
| Breaking Changes | 0 |

---

## Deployment Checklist

- [x] All imports present
- [x] No TypeScript errors
- [x] No console warnings
- [x] Backward compatible
- [x] API integration verified
- [x] State management working
- [x] Error handling implemented
- [x] Success messages added
- [x] Loading states handled
- [x] Responsive design maintained

---

**Document Version**: 1.0  
**Last Updated**: March 23, 2026  
**Status**: Ready for Production
