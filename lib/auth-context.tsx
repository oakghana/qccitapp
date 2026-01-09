"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

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
  logout: () => void
  canViewAllLocations: () => boolean
  getUserLocation: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem("qcc_current_user")
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        if (parsed && typeof parsed === "object" && parsed.id && parsed.username) {
          setUser(parsed)
        } else {
          console.error("[v0] Invalid user data in localStorage")
          localStorage.removeItem("qcc_current_user")
        }
      } catch (e) {
        console.error("[v0] Failed to parse user data from localStorage:", e)
        localStorage.removeItem("qcc_current_user")
      }
    }
  }, [])

  const logout = async () => {
    setUser(null)
    localStorage.removeItem("qcc_current_user")
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (e) {
      console.error("Logout error:", e)
    }
    window.location.href = "/"
  }

  const canViewAllLocations = () => {
    return user?.role === "admin" || user?.role === "it_head"
  }

  const getUserLocation = () => {
    return user?.location || "Head Office"
  }

  return (
    <AuthContext.Provider value={{ user, logout, canViewAllLocations, getUserLocation }}>
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
