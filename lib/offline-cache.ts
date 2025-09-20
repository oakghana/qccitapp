/**
 * Offline Cache Manager for QCC IT Tracker
 * Handles caching of critical data for offline functionality
 */

interface CacheData {
  devices: any[]
  repairRequests: any[]
  users: any[]
  notifications: any[]
  lastSync: string
  userPreferences: any
}

export class OfflineCacheManager {
  private static instance: OfflineCacheManager
  private cacheKey = 'qcc-offline-data'
  private maxCacheAge = 24 * 60 * 60 * 1000 // 24 hours

  private constructor() {}

  public static getInstance(): OfflineCacheManager {
    if (!OfflineCacheManager.instance) {
      OfflineCacheManager.instance = new OfflineCacheManager()
    }
    return OfflineCacheManager.instance
  }

  /**
   * Cache critical data for offline use
   */
  public async cacheData(data: Partial<CacheData>): Promise<void> {
    try {
      const existingData = await this.getCachedData()
      const updatedData: CacheData = {
        ...existingData,
        ...data,
        lastSync: new Date().toISOString()
      }

      localStorage.setItem(this.cacheKey, JSON.stringify(updatedData))
      console.log('Data cached successfully for offline use')
    } catch (error) {
      console.error('Failed to cache data:', error)
    }
  }

  /**
   * Retrieve cached data
   */
  public async getCachedData(): Promise<CacheData> {
    try {
      const cached = localStorage.getItem(this.cacheKey)
      if (cached) {
        const data = JSON.parse(cached)
        
        // Check if cache is still valid
        if (this.isCacheValid(data.lastSync)) {
          return data
        } else {
          console.log('Cache expired, returning default data')
          return this.getDefaultData()
        }
      }
      
      return this.getDefaultData()
    } catch (error) {
      console.error('Failed to retrieve cached data:', error)
      return this.getDefaultData()
    }
  }

  /**
   * Get specific cached data type
   */
  public async getCachedDataType<T>(type: keyof CacheData): Promise<T[]> {
    const data = await this.getCachedData()
    return (data[type] as T[]) || []
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    try {
      localStorage.removeItem(this.cacheKey)
      console.log('Cache cleared successfully')
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  /**
   * Check if user is online
   */
  public isOnline(): boolean {
    return navigator.onLine
  }

  /**
   * Setup online/offline event listeners
   */
  public setupConnectivityListeners(
    onOnline?: () => void,
    onOffline?: () => void
  ): () => void {
    const handleOnline = () => {
      console.log('Connection restored')
      this.syncOfflineData()
      onOnline?.()
    }

    const handleOffline = () => {
      console.log('Connection lost, switching to offline mode')
      onOffline?.()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  /**
   * Sync offline data when connection is restored
   */
  private async syncOfflineData(): Promise<void> {
    try {
      // Get pending offline actions
      const pendingActions = this.getPendingActions()
      
      if (pendingActions.length > 0) {
        console.log(`Syncing ${pendingActions.length} offline actions`)
        
        // Process each pending action
        for (const action of pendingActions) {
          await this.processPendingAction(action)
        }
        
        // Clear pending actions after successful sync
        this.clearPendingActions()
        console.log('Offline data synced successfully')
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error)
    }
  }

  /**
   * Store action for later sync when online
   */
  public storeOfflineAction(action: {
    type: string
    data: any
    timestamp: string
    id: string
  }): void {
    try {
      const pending = this.getPendingActions()
      pending.push(action)
      localStorage.setItem('qcc-pending-actions', JSON.stringify(pending))
      console.log('Offline action stored for later sync')
    } catch (error) {
      console.error('Failed to store offline action:', error)
    }
  }

  /**
   * Get pending offline actions
   */
  private getPendingActions(): any[] {
    try {
      const pending = localStorage.getItem('qcc-pending-actions')
      return pending ? JSON.parse(pending) : []
    } catch (error) {
      console.error('Failed to get pending actions:', error)
      return []
    }
  }

  /**
   * Process a pending action when online
   */
  private async processPendingAction(action: any): Promise<void> {
    try {
      // Implement specific action processing based on type
      switch (action.type) {
        case 'repair_request':
          // Sync repair request
          break
        case 'device_update':
          // Sync device update
          break
        case 'notification_read':
          // Sync notification status
          break
        default:
          console.log('Unknown action type:', action.type)
      }
    } catch (error) {
      console.error('Failed to process pending action:', error)
      throw error
    }
  }

  /**
   * Clear pending actions
   */
  private clearPendingActions(): void {
    localStorage.removeItem('qcc-pending-actions')
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(lastSync: string): boolean {
    if (!lastSync) return false
    
    const cacheTime = new Date(lastSync).getTime()
    const currentTime = new Date().getTime()
    
    return (currentTime - cacheTime) < this.maxCacheAge
  }

  /**
   * Get default data structure
   */
  private getDefaultData(): CacheData {
    return {
      devices: [],
      repairRequests: [],
      users: [],
      notifications: [],
      lastSync: '',
      userPreferences: {}
    }
  }

  /**
   * Preload critical data for offline use
   */
  public async preloadCriticalData(): Promise<void> {
    if (!this.isOnline()) {
      console.log('Offline - skipping data preload')
      return
    }

    try {
      // This would be replaced with actual API calls
      const criticalData = {
        devices: await this.fetchDevicesData(),
        repairRequests: await this.fetchRepairRequestsData(),
        notifications: await this.fetchNotificationsData(),
      }

      await this.cacheData(criticalData)
      console.log('Critical data preloaded for offline use')
    } catch (error) {
      console.error('Failed to preload critical data:', error)
    }
  }

  /**
   * Mock fetch functions (replace with actual API calls)
   */
  private async fetchDevicesData(): Promise<any[]> {
    // Replace with actual API call
    return [
      { id: 1, name: 'Dell Laptop', status: 'active' },
      { id: 2, name: 'HP Printer', status: 'maintenance' }
    ]
  }

  private async fetchRepairRequestsData(): Promise<any[]> {
    // Replace with actual API call
    return [
      { id: 1, device: 'Dell Laptop', status: 'pending' },
      { id: 2, device: 'HP Printer', status: 'in_progress' }
    ]
  }

  private async fetchNotificationsData(): Promise<any[]> {
    // Replace with actual API call
    return [
      { id: 1, message: 'Repair completed', read: false },
      { id: 2, message: 'New device added', read: true }
    ]
  }
}

// Export singleton instance
export const offlineCacheManager = OfflineCacheManager.getInstance()

// Export hook for React components
export function useOfflineCache() {
  const cacheManager = OfflineCacheManager.getInstance()

  return {
    cacheData: (data: Partial<CacheData>) => cacheManager.cacheData(data),
    getCachedData: () => cacheManager.getCachedData(),
    getCachedDataType: <T>(type: keyof CacheData) => cacheManager.getCachedDataType<T>(type),
    clearCache: () => cacheManager.clearCache(),
    isOnline: () => cacheManager.isOnline(),
    storeOfflineAction: (action: any) => cacheManager.storeOfflineAction(action),
    preloadCriticalData: () => cacheManager.preloadCriticalData(),
    setupConnectivityListeners: (onOnline?: () => void, onOffline?: () => void) =>
      cacheManager.setupConnectivityListeners(onOnline, onOffline)
  }
}