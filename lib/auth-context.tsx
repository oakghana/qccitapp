"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { offlineCacheManager } from "@/lib/offline-cache"
import { safeJsonParse, safeStorage } from "@/lib/utils"

export interface User {
  id: string
  username: string
  role:
    | "admin"
    | "regional_it_head"
    | "it_head"
    | "it_staff"
    | "it_store_head"
    | "staff"
    | "user"
    | "service_provider"
    | "service_desk_accra"
    | "service_desk_kumasi"
    | "service_desk_takoradi"
    | "service_desk_tema"
    | "service_desk_sunyani"
    | "service_desk_cape_coast"
  location: string
  name: string
  email: string
  full_name?: string
  department?: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
  canViewAllLocations: () => boolean
  getUserLocation: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const savedUser = safeStorage.get("qcc_current_user")
    const parsed = safeJsonParse<User | null>(savedUser, null)

    if (parsed && typeof parsed === "object" && parsed.id && parsed.username) {
      setUser(parsed)
    } else if (savedUser) {
      console.error("[v0] Invalid user data in localStorage")
      safeStorage.remove("qcc_current_user")
    }
  }, [])

  const logout = async () => {
    // Clear cache before logout
    offlineCacheManager.clearCache()

    setUser(null)
    safeStorage.remove("qcc_current_user")
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (e) {
      console.error("Logout error:", e)
    }
    window.location.href = "/"
  }

  const canViewAllLocations = () => {
    // Only admin and IT head can see all locations nationwide
    return user?.role === "admin" || user?.role === "it_head"
  }

  const getUserLocation = () => {
    return user?.location || "Head Office"
  }

  const updateUser = (newUser: User | null) => {
    setUser(newUser)
    if (newUser) {
      safeStorage.set("qcc_current_user", JSON.stringify(newUser))
    } else {
      safeStorage.remove("qcc_current_user")
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser: updateUser, logout, canViewAllLocations, getUserLocation }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export type { User as AuthUser }
