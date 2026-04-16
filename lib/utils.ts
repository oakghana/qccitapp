import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDisplayDate(
  value?: string | Date | null,
  fallback = 'N/A',
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) return fallback

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString(undefined, options)
}

export function formatDisplayDateTime(
  value?: string | Date | null,
  fallback = 'N/A',
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) return fallback

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleString(undefined, options)
}
