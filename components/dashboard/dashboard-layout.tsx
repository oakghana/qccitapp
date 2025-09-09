"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  Monitor,
  Wrench,
  Users,
  Bell,
  LogOut,
  Home,
  Headphones,
  MessageSquare,
  BarChart3,
  Database,
  ClipboardList,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()

  const getNavigationItems = () => {
    const baseItems = [{ name: "Dashboard", href: "/dashboard", icon: Home }]

    if (user?.role === "service_provider") {
      return [...baseItems, { name: "Assigned Repairs", href: "/dashboard/assigned-repairs", icon: ClipboardList }]
    }

    if (user?.role === "user") {
      return [...baseItems, { name: "My Complaints", href: "/dashboard/complaints", icon: MessageSquare }]
    }

    if (user?.role === "it_staff") {
      return [
        ...baseItems,
        { name: "Devices", href: "/dashboard/devices", icon: Monitor },
        { name: "Service Desk", href: "/dashboard/service-desk", icon: Headphones },
        { name: "My Complaints", href: "/dashboard/complaints", icon: MessageSquare },
      ]
    }

    if (user?.role === "service_desk" || user?.role === "service_desk_head") {
      return [
        ...baseItems,
        { name: "Service Desk", href: "/dashboard/service-desk", icon: Headphones },
        { name: "My Complaints", href: "/dashboard/complaints", icon: MessageSquare },
      ]
    }

    // IT Head and Admin roles see more modules
    const fullNavigation = [
      ...baseItems,
      { name: "Devices", href: "/dashboard/devices", icon: Monitor },
      { name: "Repairs", href: "/dashboard/repairs", icon: Wrench },
      { name: "Service Desk", href: "/dashboard/service-desk", icon: Headphones },
    ]

    if (user?.role === "admin" || user?.role === "it_head") {
      fullNavigation.push(
        { name: "Users", href: "/dashboard/users", icon: Users },
        { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
      )
    }

    if (user?.role === "admin") {
      fullNavigation.push(
        { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
        { name: "System Settings", href: "/dashboard/system-settings", icon: Database },
      )
    }

    return fullNavigation
  }

  const navigation = getNavigationItems()

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-background">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        {/* Mobile sidebar */}
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center px-6 border-b">
              <h2 className="text-lg font-semibold text-foreground">
                {user?.role === "service_provider" ? "Natland Repairs" : "IT Tracker"}
              </h2>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              ))}
            </nav>
            <div className="border-t p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>

        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <div className="flex flex-col flex-grow bg-card border-r border-border">
            <div className="flex h-16 items-center px-6 border-b border-border">
              <h2 className="text-lg font-semibold text-card-foreground">
                {user?.role === "service_provider" ? "Natland Repairs" : "IT Device Tracker"}
              </h2>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-card-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </a>
              ))}
            </nav>
            <div className="border-t border-border p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          {/* Top navigation */}
          <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex flex-1"></div>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <div className="h-6 w-px bg-border" />
                <div className="flex items-center gap-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-foreground">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </span>
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-foreground">{user?.name || "User"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </Sheet>
    </div>
  )
}
