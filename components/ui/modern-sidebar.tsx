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
          "h-screen bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-xl",
          "dark:bg-gray-900/95 dark:border-gray-800/50",
          // Mobile: fixed overlay
          "fixed left-0 top-0 z-50 w-80 transform transition-all duration-300 ease-in-out lg:relative lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-gray-200/50 bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 dark:border-gray-800/50">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user?.role === "service_provider" ? "Natland Repairs" : "QCC IT Tracker"}
                </h2>
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize font-medium">
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
          <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 dark:border-gray-800/50">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 ring-2 ring-green-500/20 shadow-lg">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white font-bold text-lg">
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {user?.email || "user@qcc.com.gh"}
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-medium bg-green-100 text-green-700 border-green-300">
                {user?.location?.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" className="h-10 bg-gradient-to-r from-green-500 to-blue-500 text-white border-none hover:from-green-600 hover:to-blue-600 shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
              <Button variant="outline" size="sm" className="h-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:from-purple-600 hover:to-pink-600 shadow-md">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-6">
            <nav className="space-y-3">
              {navigation.map((item, index) => (
                <div key={item.name} className="transform transition-all duration-200 hover:scale-[1.02]">
                  <a
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-4 py-4 text-base font-medium rounded-xl transition-all duration-200",
                      "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-blue-500/10",
                      "hover:text-gray-900 dark:hover:text-white hover:shadow-md",
                      "group relative overflow-hidden border border-transparent hover:border-green-200/50",
                      "dark:hover:border-green-800/50"
                    )}
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 group-hover:from-green-100 group-hover:to-blue-100 dark:group-hover:from-green-800 dark:group-hover:to-blue-800 transition-all duration-200">
                        <item.icon className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-all duration-200" />
                      </div>
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className="h-6 px-3 text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white border-none shadow-md animate-pulse"
                      >
                        {item.badge}
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                  </a>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-gray-200/50 dark:border-gray-800/50 p-6 space-y-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <Button
              variant="ghost"
              className="w-full justify-start text-base font-medium h-12 rounded-xl hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 hover:shadow-md transition-all duration-200"
            >
              <Settings className="mr-4 h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">Settings</span>
            </Button>
            <Separator className="my-3" />
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 h-12 rounded-xl font-medium text-base transition-all duration-200"
              onClick={handleLogout}
            >
              <LogOut className="mr-4 h-5 w-5" />
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