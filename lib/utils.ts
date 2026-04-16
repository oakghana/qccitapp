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

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export const safeStorage = {
  get(key: string) {
    if (typeof window === 'undefined') return null

    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key: string, value: string) {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Ignore storage failures
    }
  },
  remove(key: string) {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.removeItem(key)
    } catch {
      // Ignore storage failures
    }
  },
  clear() {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.clear()
      window.sessionStorage.clear()
    } catch {
      // Ignore storage failures
    }
  },
}
