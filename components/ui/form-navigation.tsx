"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Home, Laptop, Wrench, MessageSquare, Users, Bell, Settings, BarChart3, FileText } from "lucide-react"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: string[]
}

const navigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["admin", "it_head", "it_staff", "service_desk_head", "service_desk_staff", "user", "service_provider"],
  },
  {
    name: "Devices",
    href: "/dashboard/devices",
    icon: Laptop,
    roles: ["admin", "it_head", "it_staff"],
  },
  {
    name: "Repairs",
    href: "/dashboard/repairs",
    icon: Wrench,
    roles: ["admin", "it_head", "it_staff"],
  },
  {
    name: "Assigned Repairs",
    href: "/dashboard/assigned-repairs",
    icon: Wrench,
    roles: ["service_provider"],
  },
  {
    name: "Service Desk",
    href: "/dashboard/service-desk",
    icon: MessageSquare,
    roles: ["admin", "it_head", "service_desk_head", "service_desk_staff", "user"],
  },
  {
    name: "My Complaints",
    href: "/dashboard/complaints",
    icon: FileText,
    roles: ["user", "it_staff", "service_desk_staff"],
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: Users,
    roles: ["admin", "it_head"],
  },
  {
    name: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    roles: ["admin", "it_head", "service_desk_head"],
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    roles: ["admin"],
  },
  {
    name: "System Settings",
    href: "/dashboard/system-settings",
    icon: Settings,
    roles: ["admin"],
  },
]

interface FormNavigationProps {
  currentPage?: string
  className?: string
}

export function FormNavigation({ currentPage, className = "" }: FormNavigationProps) {
  const { user } = useAuth()
  const router = useRouter()

  if (!user) return null

  // Filter navigation items based on user role
  const allowedItems = navigationItems.filter((item) => item.roles.includes(user.role))

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  return (
    <Card className={`mb-6 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Quick Navigation</h3>
          <span className="text-xs text-muted-foreground capitalize">
            {user.role.replace("_", " ")} • {user.location.replace("_", " ")}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allowedItems.map((item) => {
            const IconComponent = item.icon
            const isActive = currentPage === item.href

            return (
              <Button
                key={item.name}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleNavigation(item.href)}
                className="flex items-center space-x-2"
              >
                <IconComponent className="h-4 w-4" />
                <span>{item.name}</span>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
