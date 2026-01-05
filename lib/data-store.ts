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

// In-memory data stores
class DataStore {
  private users: User[] = [
    {
      id: "1",
      username: "admin",
      email: "admin@qcc.com",
      role: "admin",
      location: "Head Office - Accra",
      department: "IT Department",
      createdAt: new Date("2024-01-01"),
      isActive: true,
    },
    {
      id: "2",
      username: "ithead",
      email: "ithead@qcc.com",
      role: "it_head",
      location: "Ashanti Region",
      department: "IT Department",
      createdAt: new Date("2024-01-01"),
      isActive: true,
    },
    {
      id: "3",
      username: "itstaff",
      email: "itstaff@qcc.com",
      role: "it_staff",
      location: "Greater Accra",
      department: "IT Department",
      createdAt: new Date("2024-01-01"),
      isActive: true,
    },
  ]

  private devices: Device[] = [
    {
      id: "1",
      serialNumber: "QCC-LAP-001",
      deviceType: "Laptop",
      brand: "Dell",
      model: "Latitude 5520",
      assignedTo: "John Doe",
      location: "Head Office - Accra",
      status: "active",
      purchaseDate: new Date("2023-06-15"),
      warrantyExpiry: new Date("2026-06-15"),
      createdAt: new Date("2023-06-15"),
      updatedAt: new Date("2023-06-15"),
    },
    {
      id: "2",
      serialNumber: "QCC-DES-002",
      deviceType: "Desktop",
      brand: "HP",
      model: "EliteDesk 800",
      assignedTo: "Jane Smith",
      location: "Ashanti Region",
      status: "under_repair",
      purchaseDate: new Date("2023-03-10"),
      warrantyExpiry: new Date("2026-03-10"),
      createdAt: new Date("2023-03-10"),
      updatedAt: new Date("2024-01-15"),
    },
  ]

  private repairRequests: RepairRequest[] = [
    {
      id: "1",
      deviceId: "2",
      requestedBy: "Jane Smith",
      description: "Computer not starting up, blue screen error",
      priority: "high",
      status: "in_progress",
      attachments: ["error-screenshot.png"],
      approvedBy: "IT Head",
      serviceProvider: "TechFix Ghana",
      estimatedCompletion: new Date("2024-02-01"),
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-16"),
    },
  ]

  private serviceTickets: ServiceTicket[] = [
    {
      id: "1",
      title: "Cannot access email",
      description: "Unable to login to Outlook, getting authentication error",
      category: "software",
      priority: "medium",
      status: "open",
      requestedBy: "Michael Johnson",
      location: "Northern Region",
      attachments: [],
      createdAt: new Date("2024-01-20"),
      updatedAt: new Date("2024-01-20"),
    },
  ]

  private notifications: Notification[] = []
  private serviceProviders: ServiceProvider[] = [
    {
      id: "1",
      name: "TechFix Ghana",
      email: "info@techfixghana.com",
      phone: "+233-24-123-4567",
      specialization: ["Hardware Repair", "Network Issues"],
      location: "Accra",
      isActive: true,
      createdAt: new Date("2024-01-01"),
    },
  ]

  private storeInventory: StoreItem[] = [
    {
      id: "1",
      name: "HP Laptop Battery",
      category: "Laptop Parts",
      sku: "BAT-HP-001",
      quantity: 15,
      reorderLevel: 5,
      unit: "pieces",
      location: "head_office",
      supplier: "Tech Supplies Ltd",
      lastRestocked: new Date("2024-01-10"),
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-10"),
    },
    {
      id: "2",
      name: "Dell Keyboard",
      category: "Peripherals",
      sku: "KEY-DEL-001",
      quantity: 8,
      reorderLevel: 10,
      unit: "pieces",
      location: "head_office",
      supplier: "Office Mart",
      lastRestocked: new Date("2024-01-05"),
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-05"),
    },
    {
      id: "3",
      name: "HDMI Cable",
      category: "Cables",
      sku: "CAB-HDM-001",
      quantity: 25,
      reorderLevel: 10,
      unit: "pieces",
      location: "kumasi",
      supplier: "Tech Supplies Ltd",
      lastRestocked: new Date("2024-01-15"),
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "4",
      name: "Mouse (Wireless)",
      category: "Peripherals",
      sku: "MOU-WIR-001",
      quantity: 0,
      reorderLevel: 8,
      unit: "pieces",
      location: "accra",
      supplier: "Office Mart",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-20"),
    },
    {
      id: "5",
      name: "RAM 8GB DDR4",
      category: "Computer Parts",
      sku: "RAM-8GB-001",
      quantity: 12,
      reorderLevel: 5,
      unit: "pieces",
      location: "head_office",
      supplier: "Tech Supplies Ltd",
      lastRestocked: new Date("2024-01-12"),
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-12"),
    },
  ]

  // CRUD Operations for Users
  getUsers(): User[] {
    return [...this.users]
  }
  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id)
  }
  createUser(user: Omit<User, "id" | "createdAt">): User {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    this.users.push(newUser)
    return newUser
  }
  updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) return null
    this.users[index] = { ...this.users[index], ...updates }
    return this.users[index]
  }
  deleteUser(id: string): boolean {
    const index = this.users.findIndex((u) => u.id === id)
    if (index === -1) return false
    this.users.splice(index, 1)
    return true
  }

  // CRUD Operations for Devices
  getDevices(): Device[] {
    return [...this.devices]
  }
  getDeviceById(id: string): Device | undefined {
    return this.devices.find((d) => d.id === id)
  }
  createDevice(device: Omit<Device, "id" | "createdAt" | "updatedAt">): Device {
    const newDevice: Device = {
      ...device,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.devices.push(newDevice)
    return newDevice
  }
  updateDevice(id: string, updates: Partial<Device>): Device | null {
    const index = this.devices.findIndex((d) => d.id === id)
    if (index === -1) return null
    this.devices[index] = { ...this.devices[index], ...updates, updatedAt: new Date() }
    return this.devices[index]
  }
  deleteDevice(id: string): boolean {
    const index = this.devices.findIndex((d) => d.id === id)
    if (index === -1) return false
    this.devices.splice(index, 1)
    return true
  }

  // CRUD Operations for Repair Requests
  getRepairRequests(): RepairRequest[] {
    return [...this.repairRequests]
  }
  getRepairRequestById(id: string): RepairRequest | undefined {
    return this.repairRequests.find((r) => r.id === id)
  }
  createRepairRequest(request: Omit<RepairRequest, "id" | "createdAt" | "updatedAt">): RepairRequest {
    const newRequest: RepairRequest = {
      ...request,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.repairRequests.push(newRequest)
    return newRequest
  }
  updateRepairRequest(id: string, updates: Partial<RepairRequest>): RepairRequest | null {
    const index = this.repairRequests.findIndex((r) => r.id === id)
    if (index === -1) return null
    this.repairRequests[index] = { ...this.repairRequests[index], ...updates, updatedAt: new Date() }
    return this.repairRequests[index]
  }
  deleteRepairRequest(id: string): boolean {
    const index = this.repairRequests.findIndex((r) => r.id === id)
    if (index === -1) return false
    this.repairRequests.splice(index, 1)
    return true
  }

  // CRUD Operations for Service Tickets
  getServiceTickets(): ServiceTicket[] {
    return [...this.serviceTickets]
  }
  getServiceTicketById(id: string): ServiceTicket | undefined {
    return this.serviceTickets.find((t) => t.id === id)
  }
  createServiceTicket(ticket: Omit<ServiceTicket, "id" | "createdAt" | "updatedAt">): ServiceTicket {
    const newTicket: ServiceTicket = {
      ...ticket,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.serviceTickets.push(newTicket)
    return newTicket
  }
  updateServiceTicket(id: string, updates: Partial<ServiceTicket>): ServiceTicket | null {
    const index = this.serviceTickets.findIndex((t) => t.id === id)
    if (index === -1) return null
    this.serviceTickets[index] = { ...this.serviceTickets[index], ...updates, updatedAt: new Date() }
    return this.serviceTickets[index]
  }
  deleteServiceTicket(id: string): boolean {
    const index = this.serviceTickets.findIndex((t) => t.id === id)
    if (index === -1) return false
    this.serviceTickets.splice(index, 1)
    return true
  }

  // CRUD Operations for Notifications
  getNotifications(): Notification[] {
    return [...this.notifications]
  }
  createNotification(notification: Omit<Notification, "id" | "createdAt">): Notification {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    this.notifications.push(newNotification)
    return newNotification
  }
  deleteNotification(id: string): boolean {
    const index = this.notifications.findIndex((n) => n.id === id)
    if (index === -1) return false
    this.notifications.splice(index, 1)
    return true
  }

  // CRUD Operations for Service Providers
  getServiceProviders(): ServiceProvider[] {
    return [...this.serviceProviders]
  }
  getServiceProviderById(id: string): ServiceProvider | undefined {
    return this.serviceProviders.find((s) => s.id === id)
  }
  createServiceProvider(provider: Omit<ServiceProvider, "id" | "createdAt">): ServiceProvider {
    const newProvider: ServiceProvider = {
      ...provider,
      id: Date.now().toString(),
      createdAt: new Date(),
    }
    this.serviceProviders.push(newProvider)
    return newProvider
  }
  updateServiceProvider(id: string, updates: Partial<ServiceProvider>): ServiceProvider | null {
    const index = this.serviceProviders.findIndex((s) => s.id === id)
    if (index === -1) return null
    this.serviceProviders[index] = { ...this.serviceProviders[index], ...updates }
    return this.serviceProviders[index]
  }
  deleteServiceProvider(id: string): boolean {
    const index = this.serviceProviders.findIndex((s) => s.id === id)
    if (index === -1) return false
    this.serviceProviders.splice(index, 1)
    return true
  }

  // CRUD Operations for Store Inventory
  getStoreInventory(): StoreItem[] {
    return [...this.storeInventory]
  }

  getStoreItemById(id: string): StoreItem | undefined {
    return this.storeInventory.find((item) => item.id === id)
  }

  createStoreItem(item: Omit<StoreItem, "id" | "createdAt" | "updatedAt">): StoreItem {
    const newItem: StoreItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.storeInventory.push(newItem)
    return newItem
  }

  updateStoreItem(id: string, updates: Partial<StoreItem>): StoreItem | null {
    const index = this.storeInventory.findIndex((item) => item.id === id)
    if (index === -1) return null
    this.storeInventory[index] = { ...this.storeInventory[index], ...updates, updatedAt: new Date() }
    return this.storeInventory[index]
  }

  deleteStoreItem(id: string): boolean {
    const index = this.storeInventory.findIndex((item) => item.id === id)
    if (index === -1) return false
    this.storeInventory.splice(index, 1)
    return true
  }

  // Utility methods
  getStats() {
    return {
      totalDevices: this.devices.length,
      activeDevices: this.devices.filter((d) => d.status === "active").length,
      devicesUnderRepair: this.devices.filter((d) => d.status === "under_repair").length,
      pendingRepairs: this.repairRequests.filter((r) => r.status === "pending").length,
      openTickets: this.serviceTickets.filter((t) => t.status === "open").length,
      totalUsers: this.users.length,
      activeUsers: this.users.filter((u) => u.isActive).length,
    }
  }
}

// Global data store instance
export const dataStore = new DataStore()

// Convenience export functions for store inventory
export function getStoreInventory(): StoreItem[] {
  return dataStore.getStoreInventory()
}

export function getStoreItemById(id: string): StoreItem | undefined {
  return dataStore.getStoreItemById(id)
}

export function createStoreItem(item: Omit<StoreItem, "id" | "createdAt" | "updatedAt">): StoreItem {
  return dataStore.createStoreItem(item)
}

export function updateStoreItem(id: string, updates: Partial<StoreItem>): StoreItem | null {
  return dataStore.updateStoreItem(id, updates)
}

export function deleteStoreItem(id: string): boolean {
  return dataStore.deleteStoreItem(id)
}
