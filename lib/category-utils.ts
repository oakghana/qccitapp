/**
 * Category Normalization Utilities
 * Ensures consistent category naming across the application
 */

/**
 * Normalize category name to title case format
 * Examples: "HARDWARE" -> "Hardware", "consumables" -> "Consumables"
 */
export function normalizeCategoryName(name: string): string {
  if (!name) return ""
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Compare two category names case-insensitively
 * Returns true if categories match regardless of case
 */
export function categoriesMatch(cat1: string | null | undefined, cat2: string | null | undefined): boolean {
  if (!cat1 || !cat2) return false
  return cat1.toLowerCase().trim() === cat2.toLowerCase().trim()
}

/**
 * Filter items by category with case-insensitive comparison
 */
export function filterByCategory<T extends { category?: string | null }>(
  items: T[],
  categoryFilter: string
): T[] {
  if (!categoryFilter || categoryFilter === "all") {
    return items
  }
  
  return items.filter(item =>
    categoriesMatch(item.category, categoryFilter)
  )
}

/**
 * Get unique categories from items with normalized names
 */
export function getUniqueCategories(items: Array<{ category?: string | null }>): string[] {
  const categories = new Set<string>()
  
  items.forEach(item => {
    if (item.category) {
      categories.add(normalizeCategoryName(item.category))
    }
  })
  
  return Array.from(categories).sort()
}
