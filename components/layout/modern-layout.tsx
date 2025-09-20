"use client"

import React, { useState } from "react"
import { ModernSidebar, MobileMenuButton } from "@/components/ui/modern-sidebar"
import { PWAInstall } from "@/components/ui/pwa-install"
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
import { Bell, Search, User, Settings, LogOut, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useNotifications } from "@/lib/notification-context"
import { cn } from "@/lib/utils"

interface ModernLayoutProps {
  children: React.ReactNode
  className?: string
}

export function ModernLayout({ children, className }: ModernLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  const handleLogout = () => {
    logout()
    window.location.href = "/"
  }

  const recentNotifications = notifications.slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Sidebar */}
      <ModernSidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen}
        className="lg:w-80"
      />

      {/* Main Content */}
      <div className="lg:pl-80">
        {/* PWA Install Banner */}
        <div className="p-4">
          <PWAInstall />
        </div>

        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-gray-200/50 bg-white/95 backdrop-blur-xl px-4 sm:px-6 lg:px-8 shadow-sm dark:bg-gray-900/95 dark:border-gray-800/50">
          <div className="flex items-center gap-4">
            <MobileMenuButton onClick={() => setSidebarOpen(true)} />
            
            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center space-x-2 text-base font-medium text-gray-600 dark:text-gray-400">
              <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-blue-100 text-green-700 rounded-lg">Dashboard</span>
              <span>/</span>
              <span className="text-gray-900 dark:text-white font-semibold">Overview</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex flex-1 items-center justify-end gap-4">
            {/* Search */}
            <Button variant="ghost" size="sm" className="hidden md:flex h-12 px-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border-none rounded-xl shadow-sm">
              <Search className="h-5 w-5 mr-3" />
              Search...
              <span className="ml-3 text-sm text-gray-500 bg-white px-2 py-1 rounded-md">⌘K</span>
            </Button>

            {/* Notifications */}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="h-6 text-xs"
                      >
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
                            <span className={cn(
                              "font-medium text-sm",
                              !notification.isRead && "text-primary"
                            )}>
                              {notification.title}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <span className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <Badge 
                          variant={
                            notification.type === "success" ? "default" : 
                            notification.type === "warning" ? "secondary" : 
                            notification.type === "error" ? "destructive" : "outline"
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

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 pl-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium">{user?.name || "User"}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={cn("flex-1 p-6 sm:p-8 lg:p-10", className)}>
          <div className="mx-auto max-w-7xl">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-800/50 p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}