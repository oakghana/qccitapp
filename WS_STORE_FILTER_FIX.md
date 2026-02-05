# WS Store Details Filter Issue - Fixed

## Problem
The Store Inventory dashboard showed "Ws" location had 2 items, but when filtering the Store Summary Report for "Ws" location, the report displayed "No stock data available for the selected filters".

## Root Cause
The stock-balance-report API was using case-sensitive database comparisons:
- Location filter: `.eq("location", location)` - Exact match only
- The database stores "Ws" but the filter might receive "WS" or different casing
- SQL comparison was failing due to case mismatch

## Solution
Updated `/api/store/stock-balance-report` to use case-insensitive filtering:

```typescript
// Before (case-sensitive)
itemsQuery = itemsQuery.eq("location", location)

// After (case-insensitive)
const filteredItems = (allItems || []).filter(
  (item) => item.location?.toLowerCase() === location.toLowerCase()
)
```

## Changes Made
1. **API Enhancement**: Refactored location filtering to perform case-insensitive comparisons
2. **Regional IT Head Support**: Enhanced regional_it_head location filtering to be case-insensitive
3. **Device Type Filtering**: Ensured device type filtering works correctly alongside location filtering
4. **Error Handling**: Added safety check to return empty report if no items found

## Files Modified
- `/app/api/store/stock-balance-report/route.ts` - Fixed location filtering logic

## Testing
When filtering for "Ws" location, the report should now display the 2 items stored there, regardless of case variations in the database or dropdown.

## Verification
1. Go to Store Summary Report
2. Select location: "Ws"
3. Items should appear in the table instead of showing "No stock data available"
