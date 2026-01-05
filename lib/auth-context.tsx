"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  username: string
  role: "admin" | "regional_it_head" | "it_head" | "it_staff" | "it_store_head" | "staff" | "service_provider"
  location: string
  name: string
  email: string
  full_name?: string
  department?: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  canViewAllLocations: () => boolean
  getUserLocation: () => string
  isHydrated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    console.log("[v0] AuthContext: Initializing and reading localStorage")
    // Check for existing session
    const savedUser = localStorage.getItem("qcc_current_user")
    console.log("[v0] AuthContext: Found savedUser:", savedUser ? "yes" : "no")
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        console.log("[v0] AuthContext: Parsed user role:", parsedUser.role)
        setUser(parsedUser)
      } catch (e) {
        console.error("[v0] Failed to parse saved user:", e)
        localStorage.removeItem("qcc_current_user")
      }
    }
    setIsHydrated(true)
    console.log("[v0] AuthContext: Hydration complete")
  }, [])

  const login = (userData: User) => {
    console.log("[v0] AuthContext: Logging in user:", userData.username, "role:", userData.role)
    setUser(userData)
    localStorage.setItem("qcc_current_user", JSON.stringify(userData))
    console.log("[v0] AuthContext: User saved to localStorage")
  }

  const logout = () => {
    console.log("[v0] Logging out user")
    setUser(null)
    localStorage.removeItem("qcc_current_user")
  }

  const canViewAllLocations = () => {
    return user?.role === "admin" || (user?.location === "Head Office" && user?.role === "it_head")
  }

  const getUserLocation = () => {
    return user?.location || "Head Office"
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, canViewAllLocations, getUserLocation, isHydrated }}>
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
