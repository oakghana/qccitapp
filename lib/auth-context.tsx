"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  username: string
  role: "admin" | "regional_it_head" | "it_head" | "it_staff" | "staff" | "service_provider"
  location: "head_office" | "kumasi" | "accra" | "kaase_inland_port" | "cape_coast"
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password?: string) => boolean
  logout: () => void
  canViewAllLocations: () => boolean
  getUserLocation: () => string
  isHydrated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const userMapping: Record<string, User> = {
  "ohemengappiah@qccgh.com": {
    id: "TEMP-ADM-001",
    username: "ohemengappiah@qccgh.com",
    role: "admin",
    location: "head_office",
    name: "Ohemeng Appiah",
    email: "ohemengappiah@qccgh.com",
  },
  "servicedesk@qccgh.com": {
    id: "TEMP-SD-001",
    username: "servicedesk@qccgh.com",
    role: "it_head",
    location: "head_office",
    name: "Service Desk Manager",
    email: "servicedesk@qccgh.com",
  },
}

const validCredentials: Record<string, string> = {
  "ohemengappiah@qccgh.com": "ghana",
  "servicedesk@qccgh.com": "servicedesk123",
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Prevent hydration mismatch by marking as hydrated
    setIsHydrated(true)

    // Check for existing session
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }

    const pendingLogin = localStorage.getItem("pendingLogin")
    if (pendingLogin && !savedUser) {
      login(pendingLogin)
      localStorage.removeItem("pendingLogin")
    }
  }, [])

  const login = (username: string, password?: string) => {
    if (password && validCredentials[username] !== password) {
      return false
    }

    const userData = userMapping[username]
    if (userData) {
      setUser(userData)
      localStorage.setItem("currentUser", JSON.stringify(userData))
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
  }

  const canViewAllLocations = () => {
    return user?.role === "admin" || (user?.location === "head_office" && user?.role === "it_head")
  }

  const getUserLocation = () => {
    return user?.location || "head_office"
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
