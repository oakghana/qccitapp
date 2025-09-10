"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import {
  Home,
  Monitor,
  Wrench,
  HeadphonesIcon,
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  HelpCircle,
  ChevronRight,
  Bell,
} from "lucide-react"
import { useState } from "react"

export function DashboardNavigation() {
  const { user } = useAuth()
  const router = useRouter()
  const [showWalkthrough, setShowWalkthrough] = useState(false)

  const getNavigationItems = () => {
    const baseItems = [{ name: "Dashboard", path: "/dashboard", icon: Home, description: "Overview and statistics" }]

    if (user?.role === "service_provider") {
      return [
        ...baseItems,
        {
          name: "Assigned Repairs",
          path: "/dashboard/assigned-repairs",
          icon: Wrench,
          description: "Manage repair tasks",
        },
      ]
    }

    if (user?.role === "user") {
      return [
        ...baseItems,
        {
          name: "My Complaints",
          path: "/dashboard/complaints",
          icon: MessageSquare,
          description: "Submit and track complaints",
        },
      ]
    }

    const items = [...baseItems]

    if (user?.role === "it_staff" || user?.role === "it_head" || user?.role === "admin") {
      items.push({ name: "Devices", path: "/dashboard/devices", icon: Monitor, description: "Manage IT devices" })
    }

    if (user?.role === "it_head" || user?.role === "admin") {
      items.push({ name: "Repairs", path: "/dashboard/repairs", icon: Wrench, description: "Handle repair requests" })
    }

    if (
      user?.role === "service_desk_admin" ||
      user?.role === "service_desk_head" ||
      user?.role === "it_head" ||
      user?.role === "admin"
    ) {
      items.push({
        name: "Service Desk",
        path: "/dashboard/service-desk",
        icon: HeadphonesIcon,
        description: "Manage support tickets",
      })
    }

    if (user?.role === "it_head" || user?.role === "admin") {
      items.push(
        { name: "Users", path: "/dashboard/users", icon: Users, description: "User management" },
        { name: "Notifications", path: "/dashboard/notifications", icon: Bell, description: "System notifications" },
      )
    }

    if (user?.role === "admin") {
      items.push(
        {
          name: "System Settings",
          path: "/dashboard/system-settings",
          icon: Settings,
          description: "System configuration",
        },
        { name: "Analytics", path: "/dashboard/analytics", icon: BarChart3, description: "Reports and insights" },
      )
    }

    return items
  }

  const navigationItems = getNavigationItems()

  const getWalkthroughContent = () => {
    const roleDescriptions = {
      admin:
        "As an Administrator, you have full access to all system modules including user management, system settings, and analytics across all locations.",
      it_head:
        "As an IT Head, you can manage devices, repairs, service desk, and users. Head Office IT Heads see all locations, while regional IT Heads see only their location.",
      it_staff:
        "As IT Staff, you can manage devices in your location and view service desk requests. You cannot access repair approvals or user management.",
      service_desk_admin:
        "As Service Desk Admin, you handle support tickets and can escalate issues to the repair team when hardware intervention is needed.",
      service_desk_head:
        "As Service Desk Head, you oversee service desk operations and manage escalations in your location.",
      service_provider:
        "As Natland Computers, you can view and manage repair tasks assigned to you by the IT department.",
      user: "As Staff, you can submit complaints and service requests through the service desk for IT support.",
    }

    return {
      title: `Welcome, ${user?.name}!`,
      role: user?.role?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      location: user?.location?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      description:
        roleDescriptions[user?.role as keyof typeof roleDescriptions] || "Welcome to the IT Device Tracking System.",
      modules: navigationItems,
    }
  }

  return (
    <>
      {/* Navigation Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {user?.role?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm text-muted-foreground">
                  {user?.location?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Dialog open={showWalkthrough} onOpenChange={setShowWalkthrough}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Module Guide
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{getWalkthroughContent().title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Badge>{getWalkthroughContent().role}</Badge>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{getWalkthroughContent().location}</span>
                    </div>

                    <p className="text-sm text-muted-foreground">{getWalkthroughContent().description}</p>

                    <div>
                      <h4 className="text-sm font-medium mb-3">Available Modules:</h4>
                      <div className="grid gap-2">
                        {getWalkthroughContent().modules.map((module) => (
                          <div
                            key={module.path}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => {
                              router.push(module.path)
                              setShowWalkthrough(false)
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <module.icon className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-medium">{module.name}</p>
                                <p className="text-xs text-muted-foreground">{module.description}</p>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Quick Navigation Buttons */}
              <div className="flex items-center space-x-1">
                {navigationItems.slice(0, 4).map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(item.path)}
                    className="text-xs"
                  >
                    <item.icon className="h-4 w-4 mr-1" />
                    {item.name}
                  </Button>
                ))}
                {navigationItems.length > 4 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowWalkthrough(true)} className="text-xs">
                    +{navigationItems.length - 4} more
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
