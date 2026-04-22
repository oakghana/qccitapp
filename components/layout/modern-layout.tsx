"use client"

import type React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { ModernSidebar, MobileMenuButton } from "@/components/ui/modern-sidebar"
import { PWAInstall } from "@/components/ui/pwa-install"
import { MobileAppDownload } from "@/components/ui/mobile-app-download"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Search, User, LogOut, ChevronDown, WifiOff, Zap, Loader2, Home, Headphones, Monitor, MessageSquare, Send, Database, Settings, Rss, BookOpen } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/lib/notification-context"
import { useOfflineCache } from "@/lib/offline-cache"
import { cn, formatDisplayDateTime, safeStorage } from "@/lib/utils"

interface ModernLayoutProps {
  children: React.ReactNode
  className?: string
}

export function ModernLayout({ children, className }: ModernLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [showMobileDownload, setShowMobileDownload] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { setupConnectivityListeners, preloadCriticalData, isOnline: checkOnline, clearCache } = useOfflineCache()

  useEffect(() => {
    setIsMounted(true)

    setIsOnline(checkOnline())

    const shouldShowMobileDownload = safeStorage.get("showMobileAppDownload") === "true"
    if (shouldShowMobileDownload) {
      setShowMobileDownload(true)
      safeStorage.remove("showMobileAppDownload")
    }

    const cleanup = setupConnectivityListeners(
      () => {
        setIsOnline(true)
        preloadCriticalData()
      },
      () => setIsOnline(false),
    )

    if (checkOnline()) {
      preloadCriticalData()
    }

    return cleanup
  }, [])

  const handleLogout = () => {
    // Clear ALL cached data before logout
    clearCache()
    
    // Clear localStorage
    safeStorage.clear()
    
    // Wait a moment for cache to clear, then logout
    setTimeout(() => {
      logout()
    }, 100)
  }

  const recentNotifications = notifications.slice(0, 5)
  
  // Check if user can see notifications menu (IT Head and Admin only)
  const canSeeNotifications = user?.role === "it_head" || user?.role === "admin"

  // Icon quick-access links
  const isMinimalUser = user?.role === "staff" || user?.role === "user"
  const quickIconLinks = isMinimalUser
    ? [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        { name: "Messages", href: "/dashboard/notifications", icon: Bell },
        { name: "Service Desk", href: "/dashboard/service-desk", icon: Headphones },
        { name: "Devices", href: "/dashboard/devices", icon: Monitor },
      ]
    : user?.role === "admin"
    ? [
        { name: "Dashboard", href: "/dashboard", icon: Home },
        { name: "Service Desk", href: "/dashboard/service-desk", icon: Headphones },
        { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
        { name: "Broadcast", href: "/dashboard/broadcast-notifications", icon: Send },
        { name: "Lookup Data", href: "/dashboard/lookup-data", icon: Database },
        { name: "Settings", href: "/dashboard/system-settings", icon: Settings },
        { name: "Updates", href: "/dashboard/updates", icon: Rss },
        { name: "Help Guide", href: "/dashboard/help-guide", icon: BookOpen },
      ]
    : []

  const quickAccessLinks: { name: string; href: string }[] = []

  const pageTitle = pathname
    ?.split("/")
    .filter(Boolean)
    .slice(-1)[0]
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()) || "Overview"

  if (!isMounted) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950 dark:via-amber-950 dark:to-yellow-950">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
            <div className="text-orange-600 dark:text-orange-400">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
    return null
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950 dark:via-amber-950 dark:to-yellow-950">
      {/* Sidebar */}
      <ModernSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onCollapseChange={setSidebarCollapsed}
        className="flex-shrink-0"
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* PWA Install Banner */}
        <div className="p-4">
          <PWAInstall />
        </div>

        {/* Mobile App Download Notification */}
        {showMobileDownload && (
          <div className="px-4 pb-4">
            <MobileAppDownload showOnLogin={true} autoShow={true} />
          </div>
        )}

        {/* Always Available Mobile Download Component (hidden) */}
        <MobileAppDownload showOnLogin={false} />

        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-orange-200/50 bg-white/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 shadow-sm dark:bg-orange-950/95 dark:border-orange-800/50 flex-shrink-0">
          <div className="flex items-center gap-4">
            <MobileMenuButton onClick={() => setSidebarOpen(true)} />

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center space-x-2 text-base font-medium text-orange-600 dark:text-orange-400">
              <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 rounded-lg dark:from-orange-900/30 dark:to-amber-900/30 dark:text-orange-300">
                Dashboard
              </span>
              <span>/</span>
              <span className="text-orange-900 dark:text-orange-100 font-semibold">{pageTitle}</span>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4">
            {/* Notifications - Only visible to IT Head and Admin */}
            {canSeeNotifications && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Notifications
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{unreadCount}</Badge>
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-6 text-xs">
                          Mark all read
                        </Button>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {recentNotifications.length > 0 ? (
                    recentNotifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex flex-col items-start p-4 cursor-pointer"
                        onClick={() => !notification.isRead && markAsRead(notification.id)}
                      >
                        <div className="flex w-full items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cn("font-medium text-sm", !notification.isRead && "text-primary")}>
                                {notification.title}
                              </span>
                              {!notification.isRead && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                            <span className="text-xs text-muted-foreground mt-1">
                              {formatDisplayDateTime(notification.timestamp)}
                            </span>
                          </div>
                          <Badge
                            variant={
                              notification.type === "success"
                                ? "default"
                                : notification.type === "warning"
                                  ? "secondary"
                                  : notification.type === "error"
                                    ? "destructive"
                                    : "outline"
                            }
                            className="text-xs ml-2"
                          >
                            {notification.type}
                          </Badge>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem className="text-center text-muted-foreground py-8">
                      No notifications
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-center text-primary">
                    <a href="/dashboard/notifications" className="w-full">
                      View all notifications
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User display: name + role only, no dropdown for non-admins */}
            <div className="flex items-center gap-2 pl-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium leading-none">{user?.name || "User"}</span>
                <span className="text-xs text-muted-foreground capitalize mt-0.5">{user?.role?.replace(/_/g, " ") || "staff"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Icon Quick Access bar for staff/user roles */}
        {quickIconLinks.length > 0 && (
          <div className="border-b border-orange-200/50 bg-white/85 px-4 shadow-sm backdrop-blur-sm dark:border-orange-800/50 dark:bg-orange-950/75 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto py-2">
              {quickIconLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(`${link.href}/`))
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium transition-colors min-w-[64px]",
                      isActive
                        ? "bg-orange-500 text-white shadow-sm"
                        : "text-orange-700 hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/40"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {quickAccessLinks.length > 0 && (
          <div className="border-b border-orange-200/50 bg-white/85 px-4 shadow-sm backdrop-blur-sm dark:border-orange-800/50 dark:bg-orange-950/75 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto py-3">
              {quickAccessLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      isActive
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    )}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className={cn("flex-1 p-6 sm:p-8 lg:p-10 overflow-auto", className)}>
          <div className="mx-auto max-w-7xl h-full">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-orange-200/50 dark:bg-orange-950/80 dark:border-orange-800/50 p-8 min-h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
