# Store Category Case Sensitivity Fix

## Issue
Store categories were being compared with case-sensitive exact matching, causing filters to fail when category names had different casing (e.g., "Hardware" vs "hardware", "Consumables" vs "consumables").

## Root Causes
1. **API Level** - `/api/store/stock-balance-report` used exact string comparison for device type filtering
2. **Component Level** - `store-inventory.tsx` and `assign-stock-to-staff.tsx` used case-sensitive category matching

## Files Fixed

### 1. `/app/api/store/stock-balance-report/route.ts` (Line 165-167)
**Before:**
```typescript
if (deviceType !== "all") {
  items = items.filter((item) => item.category === deviceType)
}
```

**After:**
```typescript
if (deviceType !== "all") {
  items = items.filter(
    (item) => item.category?.toLowerCase() === deviceType.toLowerCase()
  )
}
```

### 2. `/components/store/store-inventory.tsx` (Line 129)
**Before:**
```typescript
const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
```

**After:**
```typescript
const matchesCategory = categoryFilter === "all" || item.category?.toLowerCase() === categoryFilter.toLowerCase()
```

### 3. `/components/store/assign-stock-to-staff.tsx` (Line 383)
**Before:**
```typescript
const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
```

**After:**
```typescript
const matchesCategory = categoryFilter === "all" || item.category?.toLowerCase() === categoryFilter.toLowerCase()
```

## Impact
- Store inventory filtering now works correctly regardless of category name casing
- Stock balance reports display items for all category name variations
- Staff assignment filtering handles category names consistently
- Categories API already uses `.ilike()` for case-insensitive lookups

## Testing
Filter results should now show items for categories with different casing:
- "Hardware" = "hardware" = "HARDWARE"
- "Consumables" = "consumables" = "CONSUMABLES"
- "Accessories" = "accessories" = "ACCESSORIES"
