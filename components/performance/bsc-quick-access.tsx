"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Activity,
  Sliders,
  CheckSquare,
  TrendingUp,
  Target,
  Award,
  Users,
  BarChart3,
  Calendar,
  ArrowRight
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

export function BSCQuickAccess() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // Only show for IT staff and leadership
  const allowedRoles = ["it_staff", "it_head", "regional_it_head", "admin"]
  
  if (!user || !allowedRoles.includes(user.role)) {
    return null
  }

  const bscModules = [
    {
      title: "My Performance",
      description: "View your real-time BSC performance dashboard",
      href: "/dashboard/my-performance",
      icon: Activity,
      color: "bg-blue-500",
      badge: "Live",
      roles: ["it_staff", "it_head", "regional_it_head", "admin"]
    },
    {
      title: "Scorecard Manager",
      description: "Manage and assign BSC metrics to staff",
      href: "/dashboard/scorecard-manager",
      icon: Sliders,
      color: "bg-purple-500",
      badge: "Manager",
      roles: ["it_head", "regional_it_head", "admin"]
    },
    {
      title: "Task Verification",
      description: "Verify staff task completions for BSC scoring",
      href: "/dashboard/task-verification",
      icon: CheckSquare,
      color: "bg-green-500",
      badge: "Verify",
      roles: ["it_staff", "it_head", "regional_it_head", "admin"]
    }
  ]

  const availableModules = bscModules.filter(module => 
    module.roles.includes(user.role)
  )

  return (
    <>
      {/* Floating BSC Access Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
              size="icon"
            >
              <BarChart3 className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                BSC Performance System
              </DialogTitle>
              <DialogDescription>
                Quick access to Balanced Scorecard modules for IT department
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3">
              {availableModules.map((module) => {
                const Icon = module.icon
                return (
                  <Link key={module.href} href={module.href} onClick={() => setIsOpen(false)}>
                    <Card className="hover:shadow-md transition-all cursor-pointer hover:scale-[1.02]">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${module.color} text-white`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">{module.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {module.badge}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {module.description}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">BSC Information</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Balanced Scorecard system for performance management and continuous improvement in IT operations.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* BSC Badge in Dashboard Header (Alternative access) */}
      <div className="fixed top-20 right-6 z-40">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-blue-50 transition-colors bg-white shadow-sm border-blue-200"
            >
              <BarChart3 className="h-3 w-3 mr-1 text-blue-600" />
              BSC System
            </Badge>
          </DialogTrigger>
        </Dialog>
      </div>
    </>
  )
}
