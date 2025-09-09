"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  username: string
  role: "admin" | "it_head" | "it_staff" | "service_desk_head" | "service_desk_staff" | "service_provider" | "user"
  location: "head_office" | "kumasi" | "accra" | "tamale" | "cape_coast"
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (username: string) => void
  logout: () => void
  canViewAllLocations: () => boolean
  getUserLocation: () => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const userMapping: Record<string, User> = {
  "admin.headoffice": {
    id: "ADM-001",
    username: "admin.headoffice",
    role: "admin",
    location: "head_office",
    name: "Head Office Admin",
    email: "admin@qcc.com.gh",
  },
  "admin.kumasi": {
    id: "ADM-002",
    username: "admin.kumasi",
    role: "admin",
    location: "kumasi",
    name: "Kumasi Admin",
    email: "admin.kumasi@qcc.com.gh",
  },
  "ithead.headoffice": {
    id: "ITH-001",
    username: "ithead.headoffice",
    role: "it_head",
    location: "head_office",
    name: "Head Office IT Head",
    email: "ithead@qcc.com.gh",
  },
  "ithead.kumasi": {
    id: "ITH-002",
    username: "ithead.kumasi",
    role: "it_head",
    location: "kumasi",
    name: "Kumasi IT Head",
    email: "ithead.kumasi@qcc.com.gh",
  },
  "deskhead.headoffice": {
    id: "DSH-001",
    username: "deskhead.headoffice",
    role: "service_desk_head",
    location: "head_office",
    name: "Head Office Service Desk Head",
    email: "deskhead@qcc.com.gh",
  },
  "deskhead.kumasi": {
    id: "DSH-002",
    username: "deskhead.kumasi",
    role: "service_desk_head",
    location: "kumasi",
    name: "Kumasi Service Desk Head",
    email: "deskhead.kumasi@qcc.com.gh",
  },
  "desk.headoffice": {
    id: "DSS-001",
    username: "desk.headoffice",
    role: "service_desk_staff",
    location: "head_office",
    name: "Head Office Service Desk Staff",
    email: "desk@qcc.com.gh",
  },
  "desk.kumasi": {
    id: "DSS-002",
    username: "desk.kumasi",
    role: "service_desk_staff",
    location: "kumasi",
    name: "Kumasi Service Desk Staff",
    email: "desk.kumasi@qcc.com.gh",
  },
  "staff.headoffice": {
    id: "ITS-001",
    username: "staff.headoffice",
    role: "it_staff",
    location: "head_office",
    name: "Head Office IT Staff",
    email: "staff@qcc.com.gh",
  },
  "staff.kumasi": {
    id: "ITS-002",
    username: "staff.kumasi",
    role: "it_staff",
    location: "kumasi",
    name: "Kumasi IT Staff",
    email: "staff.kumasi@qcc.com.gh",
  },
  "natland.provider": {
    id: "SP-001",
    username: "natland.provider",
    role: "service_provider",
    location: "head_office",
    name: "Natland Computers",
    email: "support@natlandcomputers.com.gh",
  },
  "user.headoffice": {
    id: "USR-001",
    username: "user.headoffice",
    role: "user",
    location: "head_office",
    name: "John Mensah",
    email: "john.mensah@qcc.com.gh",
  },
  "user.kumasi": {
    id: "USR-002",
    username: "user.kumasi",
    role: "user",
    location: "kumasi",
    name: "Akosua Asante",
    email: "akosua.asante@qcc.com.gh",
  },
  "user.accra": {
    id: "USR-003",
    username: "user.accra",
    role: "user",
    location: "accra",
    name: "Kwame Osei",
    email: "kwame.osei@qcc.com.gh",
  },
  "user.tamale": {
    id: "USR-004",
    username: "user.tamale",
    role: "user",
    location: "tamale",
    name: "Fatima Ibrahim",
    email: "fatima.ibrahim@qcc.com.gh",
  },
  "user.capecoast": {
    id: "USR-005",
    username: "user.capecoast",
    role: "user",
    location: "cape_coast",
    name: "Kofi Adjei",
    email: "kofi.adjei@qcc.com.gh",
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
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

  const login = (username: string) => {
    const userData = userMapping[username]
    if (userData) {
      setUser(userData)
      localStorage.setItem("currentUser", JSON.stringify(userData))
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
  }

  const canViewAllLocations = () => {
    return user?.location === "head_office" && (user?.role === "admin" || user?.role === "it_head")
  }

  const getUserLocation = () => {
    return user?.location || "head_office"
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, canViewAllLocations, getUserLocation }}>
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
