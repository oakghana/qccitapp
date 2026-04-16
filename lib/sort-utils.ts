export type SortDirection = "asc" | "desc"

function getNestedValue(item: any, path: string) {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), item)
}

function toSnakeCase(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

function toCamelCase(value: string) {
  return value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function getFieldValue(item: any, path: string) {
  const directValue = getNestedValue(item, path)
  if (directValue != null) return directValue

  if (!path.includes(".")) {
    const alternatePath = path.includes("_") ? toCamelCase(path) : toSnakeCase(path)
    const alternateValue = getNestedValue(item, alternatePath)
    if (alternateValue != null) return alternateValue

    const aliases: Record<string, string[]> = {
      name: ["itemName", "item_name", "title"],
      itemName: ["name", "item_name"],
      item_name: ["name", "itemName"],
      quantity: ["quantity_in_stock"],
      reorderLevel: ["reorder_level"],
      createdDate: ["created_at", "created"],
      lastUpdated: ["updated_at", "updated"],
    }

    for (const alias of aliases[path] || []) {
      const aliasValue = getNestedValue(item, alias)
      if (aliasValue != null) return aliasValue
    }
  }

  return undefined
}

function normalizeValue(value: unknown): string | number {
  if (value == null) return ""
  if (typeof value === "number") return value
  if (typeof value === "boolean") return value ? 1 : 0

  const text = String(value).trim()
  if (!text) return ""

  const numeric = Number(text)
  if (!Number.isNaN(numeric) && /^-?\d+(\.\d+)?$/.test(text)) {
    return numeric
  }

  const timestamp = Date.parse(text)
  if (!Number.isNaN(timestamp) && /[-/:T ]/.test(text)) {
    return timestamp
  }

  return text.toLowerCase()
}

export function sortItems<T>(items: T[], field: string, direction: SortDirection = "asc"): T[] {
  if (!field || field === "none") return [...items]

  const sorted = [...items].sort((a: any, b: any) => {
    const aValue = normalizeValue(getFieldValue(a, field))
    const bValue = normalizeValue(getFieldValue(b, field))

    if (aValue < bValue) return direction === "asc" ? -1 : 1
    if (aValue > bValue) return direction === "asc" ? 1 : -1
    return 0
  })

  return sorted
}
