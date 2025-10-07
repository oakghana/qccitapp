"use client"

import React, { useState, useEffect } from "react"
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
  UserPlus,
  Bell,
  LogOut,
  Settings,
  Headphones,
  MessageSquare,
  CheckSquare,
  BarChart3,
  Database,
  ClipboardList,
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Building2,
  Truck,
  FileText,
  Rss,
  PanelLeftClose,
  PanelLeft,
  Activity,
  Sliders
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { getRoleColorScheme, getRoleGradientClass, getRoleTextClass, getRoleBorderClass, getRoleBackgroundClass } from "@/lib/role-colors"

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
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])
  const roleColors = user?.role ? getRoleColorScheme(user.role) : null

  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      { name: "Dashboard", href: "/dashboard", icon: Home }
    ]

    // Staff role - service desk access for all staff (no BSC access)
    if (user?.role === "staff") {
      return [
        ...baseItems,
        { name: "Service Desk", href: "/dashboard/service-desk", icon: Headphones, badge: "New" },
        { name: "My Complaints", href: "/dashboard/complaints", icon: MessageSquare },
        { name: "Updates", href: "/dashboard/updates", icon: Rss, badge: "2" },
        { name: "Settings", href: "/dashboard/settings", icon: Settings }
      ]
    }

    // IT Staff role - service desk and repair management + assigned tasks
    if (user?.role === "it_staff") {
      return [
        ...baseItems,
        { name: "My Performance", href: "/dashboard/my-performance", icon: Activity },
        { name: "Task Verification", href: "/dashboard/task-verification", icon: CheckSquare, badge: "3" },
        { name: "Assigned Tasks", href: "/dashboard/assigned-tasks", icon: ClipboardList, badge: "6" },
        { name: "Service Desk", href: "/dashboard/service-desk", icon: Headphones, badge: "8" },
        { name: "Repairs", href: "/dashboard/repairs", icon: Wrench, badge: "5" },
        { name: "Devices", href: "/dashboard/devices", icon: Monitor },
        { name: "My Complaints", href: "/dashboard/complaints", icon: MessageSquare },
        { name: "Updates", href: "/dashboard/updates", icon: Rss, badge: "3" },
        { name: "Settings", href: "/dashboard/settings", icon: Settings }
      ]
    }

    // IT Head role - all modules access with ticket assignment capabilities
    if (user?.role === "it_head") {
      const itHeadNavigation: NavigationItem[] = [
        ...baseItems,
        { name: "Staff Performance", href: "/dashboard/my-performance", icon: Activity, badge: "Manage" },
        { name: "Scorecard Manager", href: "/dashboard/scorecard-manager", icon: Sliders, badge: "New" },
        { name: "Task Verification", href: "/dashboard/task-verification", icon: CheckSquare, badge: "12" },
        { name: "IT Staff Status", href: "/dashboard/it-staff-status", icon: UserPlus, badge: "6" },
        { name: "Service Desk", href: "/dashboard/service-desk", icon: Headphones, badge: "5" },
        { name: "Repairs", href: "/dashboard/repairs", icon: Wrench, badge: "12" },
        { name: "Devices", href: "/dashboard/devices", icon: Monitor },
        { name: "IT Service Provider", href: "/dashboard/service-provider", icon: Truck, badge: "2" },
        { name: "IT Reports", href: "/dashboard/it-reports", icon: FileText, badge: "New" },
        { name: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: notifications },
        { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
        { name: "Updates", href: "/dashboard/updates", icon: Rss, badge: "4" },
        { name: "Settings", href: "/dashboard/settings", icon: Settings }
      ]
      return itHeadNavigation
    }

    // Regional IT Head role - manages regional IT operations (location-based)
    if (user?.role === "regional_it_head") {
      const regionalNavigation: NavigationItem[] = [
        ...baseItems,
        { name: "Staff Performance", href: "/dashboard/my-performance", icon: Activity, badge: "Manage" },
        { name: "Scorecard Manager", href: "/dashboard/scorecard-manager", icon: Sliders, badge: "New" },
        { name: "Task Verification", href: "/dashboard/task-verification", icon: CheckSquare, badge: "8" },
        { name: "IT Staff Status", href: "/dashboard/it-staff-status", icon: Users, badge: "4" },
        { name: "Service Desk", href: "/dashboard/service-desk", icon: Headphones, badge: "3" },
        { name: "Repairs", href: "/dashboard/repairs", icon: Wrench, badge: "8" },
        { name: "Devices", href: "/dashboard/devices", icon: Monitor },
        { name: "IT Service Provider", href: "/dashboard/service-provider", icon: Truck, badge: "1" },
        { name: "IT Reports", href: "/dashboard/it-reports", icon: FileText, badge: "New" },
        { name: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: notifications },
        { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
        { name: "Updates", href: "/dashboard/updates", icon: Rss, badge: "5" },
        { name: "Settings", href: "/dashboard/settings", icon: Settings }
      ]
      return regionalNavigation
    }

    // Admin role - full system access
    if (user?.role === "admin") {
      const fullNavigation: NavigationItem[] = [
        ...baseItems,
        { name: "Staff Performance", href: "/dashboard/my-performance", icon: Activity, badge: "Manage" },
        { name: "Task Verification", href: "/dashboard/task-verification", icon: CheckSquare, badge: "15" },
        { name: "IT Staff Status", href: "/dashboard/it-staff-status", icon: Building2, badge: "8" },
        { name: "Service Desk", href: "/dashboard/service-desk", icon: Headphones, badge: "5" },
        { name: "Repairs", href: "/dashboard/repairs", icon: Wrench, badge: "12" },
        { name: "Devices", href: "/dashboard/devices", icon: Monitor },
        { name: "IT Service Provider", href: "/dashboard/service-provider", icon: Truck, badge: "4" },
        { name: "IT Reports", href: "/dashboard/it-reports", icon: FileText, badge: "New" },
        { name: "Users", href: "/dashboard/users", icon: Users },
        { name: "User Accounts", href: "/dashboard/user-accounts", icon: UserPlus, badge: "3" },
        { name: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: notifications },
        { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
        { name: "System Settings", href: "/dashboard/system-settings", icon: Database },
        { name: "Updates", href: "/dashboard/updates", icon: Rss, badge: "6" },
        { name: "Settings", href: "/dashboard/settings", icon: Settings }
      ]
      return fullNavigation
    }

    // Service Provider role - repair management and service delivery
    if (user?.role === "service_provider") {
      const serviceProviderNavigation: NavigationItem[] = [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        { name: "My Tasks", href: "/dashboard/service-provider", icon: Wrench, badge: "5" },
        { name: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: notifications },
        { name: "Updates", href: "/dashboard/updates", icon: Rss, badge: "1" },
        { name: "Settings", href: "/dashboard/settings", icon: Settings }
      ]
      return serviceProviderNavigation
    }

    return baseItems
  }

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  const navigation = getNavigationItems()

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "h-screen bg-white/90 backdrop-blur-2xl border-r border-gray-100/80 shadow-2xl",
          "dark:bg-gray-950/95 dark:border-gray-800/80",
          // Mobile: fixed overlay
          "fixed left-0 top-0 z-50 transform transition-all duration-300 ease-in-out lg:relative lg:z-auto",
          isCollapsed ? "w-20" : "w-72",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Minimalist Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-yellow-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    QCC IT
                  </h2>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Quality Control Co.</p>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-600 to-yellow-600 flex items-center justify-center shadow-lg mx-auto">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hidden lg:flex hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* User Profile */}
          {!isCollapsed && (
            <div className="p-4 border-b border-gray-100 dark:border-gray-800">
              <Button
                variant="ghost"
                className="w-full p-0 h-auto hover:bg-gray-50 dark:hover:bg-gray-800/50"
                onClick={() => setIsProfileExpanded(!isProfileExpanded)}
              >
                <div className="flex items-center justify-between w-full p-3 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 ring-2 ring-blue-100 dark:ring-blue-900">
                      <AvatarImage src="/placeholder-user.jpg" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-medium text-sm">
                        {user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user?.role?.replace('_', ' ') || "Staff"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-gray-400 transition-transform duration-200",
                    isProfileExpanded && "rotate-180"
                  )} />
                </div>
              </Button>
              
              {isProfileExpanded && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {user?.email || "user@qcc.com.gh"}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {user?.location?.replace('_', ' ') || "Kumasi"}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Online</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isCollapsed && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <div className="flex justify-center">
                <Avatar className="h-10 w-10 ring-2 ring-blue-100 dark:ring-blue-900">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-medium text-sm">
                    {user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          )}



          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navigation.map((item, index) => (
                <div key={item.name} className="relative group">
                  <a
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 group relative",
                      isCollapsed ? "justify-center" : "justify-between"
                    )}
                  >
                    <div className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center" : "space-x-3"
                    )}>
                      <div className="relative">
                        <item.icon className="h-5 w-5" />
                        {item.badge && isCollapsed && (
                          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 text-white border-2 border-white dark:border-gray-950">
                            {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                          </Badge>
                        )}
                      </div>
                      {!isCollapsed && (
                        <span className="font-medium text-sm">{item.name}</span>
                      )}
                    </div>
                    {!isCollapsed && item.badge && (
                      <Badge 
                        variant="secondary" 
                        className="h-5 px-2 text-xs bg-red-500 text-white border-none"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </a>
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {item.name}
                      {item.badge && (
                        <span className="ml-2 px-1 bg-red-500 text-white rounded text-xs">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            
            {/* Quick Actions - only when not collapsed */}
            {!isCollapsed && (
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="px-3 mb-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quick Actions
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:border-blue-800 dark:text-blue-300"
                    onClick={() => {
                      if (user?.role === "staff") {
                        window.location.href = "/dashboard/complaints"
                      } else {
                        window.location.href = "/dashboard/repairs"
                      }
                    }}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    New Request
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-gray-800 p-3 space-y-1">
            {!isCollapsed ? (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm h-10 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-10 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
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
