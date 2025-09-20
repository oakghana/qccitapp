"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Menu,
  X,
  Home,
  Monitor,
  Wrench,
  Users,
  Bell,
  LogOut,
  Settings,
  Headphones,
  MessageSquare,
  BarChart3,
  Database,
  ClipboardList,
  Search,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

interface NavigationItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string | number
}

interface ModernSidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  className?: string
}

export function ModernSidebar({ isOpen, setIsOpen, className }: ModernSidebarProps) {
  const { user, logout } = useAuth()
  const [notifications] = useState(3)

  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      { name: "Dashboard", href: "/dashboard", icon: Home },
    ]

    if (user?.role === "service_provider") {
      return [
        ...baseItems,
        { name: "Assigned Repairs", href: "/dashboard/assigned-repairs", icon: ClipboardList, badge: "2" }
      ]
    }

    if (user?.role === "user") {
      return [
        ...baseItems,
        { name: "My Complaints", href: "/dashboard/complaints", icon: MessageSquare }
      ]
    }

    if (user?.role === "it_staff") {
      return [
        ...baseItems,
        { name: "Devices", href: "/dashboard/devices", icon: Monitor },
        { name: "Service Desk", href: "/dashboard/service-desk", icon: Headphones, badge: "5" },
        { name: "My Complaints", href: "/dashboard/complaints", icon: MessageSquare }
      ]
    }

    if (user?.role === "service_desk_staff" || user?.role === "service_desk_head") {
      return [
        ...baseItems,
        { name: "Service Desk", href: "/dashboard/service-desk", icon: Headphones, badge: "8" },
        { name: "My Complaints", href: "/dashboard/complaints", icon: MessageSquare }
      ]
    }

    // IT Head and Admin roles see more modules
    const fullNavigation: NavigationItem[] = [
      ...baseItems,
      { name: "Devices", href: "/dashboard/devices", icon: Monitor },
      { name: "Repairs", href: "/dashboard/repairs", icon: Wrench, badge: "12" },
      { name: "Service Desk", href: "/dashboard/service-desk", icon: Headphones, badge: "5" },
    ]

    if (user?.role === "admin" || user?.role === "it_head") {
      fullNavigation.push(
        { name: "Users", href: "/dashboard/users", icon: Users },
        { name: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: notifications }
      )
    }

    if (user?.role === "admin") {
      fullNavigation.push(
        { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
        { name: "System Settings", href: "/dashboard/system-settings", icon: Database }
      )
    }

    return fullNavigation
  }

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  const navigation = getNavigationItems()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 bg-background/95 backdrop-blur-md border-r border-border/50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "lg:relative lg:translate-x-0 lg:flex lg:flex-col",
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border/50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">QCC</span>
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-foreground">
                  {user?.role === "service_provider" ? "Natland Repairs" : "IT Device Tracker"}
                </h2>
                <span className="text-xs text-muted-foreground capitalize">
                  {user?.role?.replace('_', ' ')} Portal
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-primary/10">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "user@qcc.com.gh"}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {user?.location?.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 border-b border-border/50">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-8">
                <Plus className="h-3 w-3 mr-1" />
                New
              </Button>
              <Button variant="outline" size="sm" className="h-8">
                <Search className="h-3 w-3 mr-1" />
                Search
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <div key={item.name} className="transform transition-all duration-200 hover:scale-[1.02]">
                  <a
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                      "text-foreground hover:bg-accent hover:text-accent-foreground",
                      "group relative overflow-hidden"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className="h-5 px-2 text-xs bg-primary/10 text-primary border-primary/20"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border/50 p-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
            >
              <Settings className="mr-3 h-4 w-4" />
              Settings
            </Button>
            <Separator className="my-2" />
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={onClick}
    >
      <Menu className="h-5 w-5" />
    </Button>
  )
}