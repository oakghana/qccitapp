export interface User {
  id: string
  username: string
  email: string
  role: "admin" | "it_head" | "it_staff" | "user"
  location: string
  department: string
  createdAt: Date
  isActive: boolean
}

export interface Device {
  id: string
  serialNumber: string
  deviceType: string
  brand: string
  model: string
  assignedTo: string
  location: string
  status: "active" | "inactive" | "under_repair" | "retired"
  purchaseDate: Date
  warrantyExpiry: Date
  createdAt: Date
  updatedAt: Date
}

export interface RepairRequest {
  id: string
  deviceId: string
  requestedBy: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "approved" | "in_progress" | "completed" | "rejected"
  attachments: string[]
  approvedBy?: string
  serviceProvider?: string
  estimatedCompletion?: Date
  actualCompletion?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ServiceTicket {
  id: string
  title: string
  description: string
  category: "hardware" | "software" | "network" | "access" | "other"
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in_progress" | "resolved" | "closed"
  requestedBy: string
  assignedTo?: string
  location: string
  attachments: string[]
  resolution?: string
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  type: "email" | "sms"
  recipient: string
  subject: string
  message: string
  status: "pending" | "sent" | "failed"
  sentAt?: Date
  createdAt: Date
}

export interface ServiceProvider {
  id: string
  name: string
  email: string
  phone: string
  specialization: string[]
  location: string
  isActive: boolean
  createdAt: Date
}

export interface StoreItem {
  id: string
  name: string
  category: string
  sku: string
  quantity: number
  reorderLevel: number
  unit: string
  location: string
  supplier?: string
  lastRestocked?: Date
  createdAt: Date
  updatedAt: Date
}

// Placeholder functions for components still using data-store
// These should be replaced with Supabase queries
export function getStoreInventory(): StoreItem[] {
  return []
}

export function getStoreItemById(id: string): StoreItem | undefined {
  return undefined
}

export function createStoreItem(item: Omit<StoreItem, "id" | "createdAt" | "updatedAt">): StoreItem {
  throw new Error("Use Supabase instead")
}

export function updateStoreItem(id: string, updates: Partial<StoreItem>): StoreItem | null {
  throw new Error("Use Supabase instead")
}

export function deleteStoreItem(id: string): boolean {
  throw new Error("Use Supabase instead")
}

// This file only contains TypeScript interfaces for type safety
