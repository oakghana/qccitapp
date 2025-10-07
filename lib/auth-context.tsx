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
  login: (username: string) => void
  logout: () => void
  canViewAllLocations: () => boolean
  getUserLocation: () => string
  isHydrated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const userMapping: Record<string, User> = {
  "admin": {
    id: "ADM-001",
    username: "admin",
    role: "admin",
    location: "head_office",
    name: "System Administrator",
    email: "admin@qcc.com.gh",
  },
  "regionalhead.kumasi": {
    id: "RIH-001",
    username: "regionalhead.kumasi",
    role: "regional_it_head",
    location: "kumasi",
    name: "Kumasi Regional IT Head",
    email: "regionalhead.kumasi@qcc.com.gh",
  },
  "regionalhead.accra": {
    id: "RIH-002",
    username: "regionalhead.accra",
    role: "regional_it_head",
    location: "accra",
    name: "Accra Regional IT Head",
    email: "regionalhead.accra@qcc.com.gh",
  },
  "regionalhead.kaase": {
    id: "RIH-003",
    username: "regionalhead.kaase",
    role: "regional_it_head",
    location: "kaase_inland_port",
    name: "Kaase Regional IT Head",
    email: "regionalhead.kaase@qcc.com.gh",
  },
  "regionalhead.capecoast": {
    id: "RIH-004",
    username: "regionalhead.capecoast",
    role: "regional_it_head",
    location: "cape_coast",
    name: "Cape Coast Regional IT Head",
    email: "regionalhead.capecoast@qcc.com.gh",
  },
  "ithead": {
    id: "ITH-001",
    username: "ithead",
    role: "it_head",
    location: "head_office",
    name: "Head Office IT Head",
    email: "ithead@qcc.com.gh",
  },
  "serviceprovider": {
    id: "SP-001",
    username: "serviceprovider",
    role: "service_provider",
    location: "head_office",
    name: "Natland IT Services",
    email: "services@natland.com.gh",
  },
  "itstaff.headoffice": {
    id: "ITS-001",
    username: "itstaff.headoffice",
    role: "it_staff",
    location: "head_office",
    name: "Head Office IT Staff",
    email: "itstaff@qcc.com.gh",
  },
  "itstaff.kumasi": {
    id: "ITS-002",
    username: "itstaff.kumasi",
    role: "it_staff",
    location: "kumasi",
    name: "Kumasi IT Staff",
    email: "itstaff.kumasi@qcc.com.gh",
  },
  "itstaff.accra": {
    id: "ITS-003",
    username: "itstaff.accra",
    role: "it_staff",
    location: "accra",
    name: "Accra IT Staff",
    email: "itstaff.accra@qcc.com.gh",
  },
  "staff.headoffice": {
    id: "STF-001",
    username: "staff.headoffice",
    role: "staff",
    location: "head_office",
    name: "John Mensah",
    email: "john.mensah@qcc.com.gh",
  },
  "staff.kumasi": {
    id: "STF-002",
    username: "staff.kumasi",
    role: "staff",
    location: "kumasi",
    name: "Akosua Asante",
    email: "akosua.asante@qcc.com.gh",
  },
  "staff.accra": {
    id: "STF-003",
    username: "staff.accra",
    role: "staff",
    location: "accra",
    name: "Kwame Osei",
    email: "kwame.osei@qcc.com.gh",
  },
  "staff.kaase": {
    id: "STF-004",
    username: "staff.kaase",
    role: "staff",
    location: "kaase_inland_port",
    name: "Fatima Ibrahim",
    email: "fatima.ibrahim@qcc.com.gh",
  },
  "staff.capecoast": {
    id: "STF-005",
    username: "staff.capecoast",
    role: "staff",
    location: "cape_coast",
    name: "Kofi Adjei",
    email: "kofi.adjei@qcc.com.gh",
  },
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
