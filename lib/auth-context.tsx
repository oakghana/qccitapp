"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
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
        setUser(JSON.parse(savedUser))
      } catch (e) {
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
    return (
      user?.role === "admin" ||
      (user?.location === "Head Office" && user?.role === "it_head") ||
      user?.role.startsWith("service_desk")
    )
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
