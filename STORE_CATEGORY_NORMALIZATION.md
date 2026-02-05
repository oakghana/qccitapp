# Store Category Case Sensitivity Fix

## Overview
Fixed comprehensive case sensitivity issues with store categories across the entire application. All categories are now normalized to title case format (e.g., "Hardware", "Consumables", "Software") for consistency.

## Changes Made

### 1. **New Utility Module** (`lib/category-utils.ts`)
- `normalizeCategoryName()` - Converts any category to title case format
- `categoriesMatch()` - Case-insensitive category comparison
- `filterByCategory()` - Filters items using case-insensitive comparison
- `getUniqueCategories()` - Extracts and normalizes unique categories from items

### 2. **API Endpoints Updated**

#### `app/api/store/categories/route.ts`
- GET: Returns all categories with normalized names
- POST: Creates new categories with normalized names, prevents duplicates using `.ilike()`

#### `app/api/store/add-stock/route.ts`
- Normalizes category before inserting new items
- Uses `normalizeCategoryName()` to ensure consistency

#### `app/api/store/stock-balance-report/route.ts`
- Already had case-insensitive filtering for device type
- All category comparisons use `.toLowerCase()`

### 3. **Components Updated**

#### `components/store/store-inventory.tsx`
- Uses `filterByCategory()` utility for consistent filtering
- Case-insensitive category matching

#### `components/store/assign-stock-to-staff.tsx`
- Uses `filterByCategory()` utility
- Consistent category filtering across stock assignment

#### `components/store/add-store-item-form.tsx`
- Normalizes category before submitting to API
- Ensures user input is converted to standard format

#### `components/store/category-selector.tsx`
- Already uses `.ilike()` for case-insensitive lookups

### 4. **Database Migration** (`scripts/090_normalize_store_categories.sql`)
- Migrates all existing categories to title case
- Adds check constraint to enforce normalized format
- Safe migration that doesn't break existing data

## Category Normalization Format

All categories are now stored in **Title Case**:
- "HARDWARE" → "Hardware"
- "consumables" → "Consumables"
- "software licenses" → "Software Licenses"
- "IT ACCESSORIES" → "It Accessories"

## Benefits

✅ **Consistency** - All categories use same format across database and UI  
✅ **Case-Insensitive Filtering** - Works regardless of user input casing  
✅ **Duplicate Prevention** - No more "Hardware", "HARDWARE", "hardware" duplicates  
✅ **Better User Experience** - Cleaner, standardized category names  
✅ **Easier Reporting** - Accurate category grouping in reports and analytics

## Migration Steps

1. Run the database migration:
   ```bash
   supabase migration run scripts/090_normalize_store_categories.sql
   ```

2. Restart application - all category filtering now uses normalized comparison

3. When adding new items, categories are automatically normalized

## Technical Details

### Category Comparison
All category comparisons are now case-insensitive using one of:
- `categoriesMatch(cat1, cat2)` - utility function
- `filterByCategory(items, filter)` - utility function
- `.toLowerCase()` - for inline comparisons
- `.ilike()` - for database queries (PostgreSQL case-insensitive like)

### API Contract
The API accepts categories in any case format and returns normalized (title case) format:
```json
{
  "category": "hardware"  // Input: any case
}
// Returns
{
  "category": "Hardware"  // Output: title case
}
```

## Testing Recommendations

- Test adding items with categories: "HARDWARE", "hardware", "Hardware"
- Test filtering report by category with different casings
- Test category selector dropdown loads correctly
- Verify existing items display with normalized names
- Check that duplicate categories no longer appear in dropdowns

## Future Improvements

- Consider adding category standardization to data import processes
- Add validation to prevent creation of non-standard categories
- Monitor for user input patterns to identify missing standard categories
