/**
 * Category Normalization Utilities
 * Ensures consistent category naming across the application
 */

/**
 * Normalize category name to title case format
 * Examples: "HARDWARE" -> "Hardware", "consumables" -> "Consumables"
 */
export function normalizeCategoryName(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return ""
  
  try {
    return name
      .toLowerCase()
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  } catch (error) {
    console.warn("[v0] Error normalizing category name:", error, name)
    return String(name)
  }
}

/**
 * Compare two category names case-insensitively
 * Returns true if categories match regardless of case
 */
export function categoriesMatch(cat1: string | null | undefined, cat2: string | null | undefined): boolean {
  try {
    if (!cat1 || !cat2) return false
    if (typeof cat1 !== 'string' || typeof cat2 !== 'string') return false
    return cat1.toLowerCase().trim() === cat2.toLowerCase().trim()
  } catch (error) {
    console.warn("[v0] Error comparing categories:", error, { cat1, cat2 })
    return false
  }
}

/**
 * Filter items by category with case-insensitive comparison
 */
export function filterByCategory<T extends { category?: string | null }>(
  items: T[],
  categoryFilter: string
): T[] {
  // Handle edge cases
  if (!Array.isArray(items) || items.length === 0) {
    return items
  }
  
  if (!categoryFilter || categoryFilter === "all") {
    return items
  }
  
  return items.filter(item => {
    try {
      return categoriesMatch(item.category, categoryFilter)
    } catch (error) {
      console.warn("[v0] Error filtering item by category:", error, item)
      return false
    }
  })
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
