"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Rss, 
  Bell, 
  Calendar, 
  User, 
  Search,
  Filter,
  ExternalLink,
  BookOpen,
  AlertCircle,
  Info,
  CheckCircle,
  TrendingUp,
  Zap,
  Clock,
  Tag
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

interface Update {
  id: string
  title: string
  description: string
  type: "system" | "feature" | "maintenance" | "security" | "announcement"
  priority: "low" | "medium" | "high" | "critical"
  date: string
  author: string
  isRead: boolean
  category: string
  tags: string[]
  content?: string
  link?: string
}

export default function UpdatesPage() {
  const { user } = useAuth()
  const [updates, setUpdates] = useState<Update[]>([])
  const [filteredUpdates, setFilteredUpdates] = useState<Update[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [selectedUpdate, setSelectedUpdate] = useState<Update | null>(null)

  useEffect(() => {
    // Mock updates data
    const mockUpdates: Update[] = [
      {
        id: "UPD-001",
        title: "New Service Provider Integration",
        description: "We've added Natland IT Services as an official repair partner. Service requests can now be automatically assigned.",
        type: "feature",
        priority: "high",
        date: "2025-01-15T10:30:00Z",
        author: "System Administrator",
        isRead: false,
        category: "Service Management",
        tags: ["Service Provider", "Repairs", "Integration"],
        content: "We're excited to announce our new partnership with Natland IT Services. This integration allows for seamless repair request management, automatic task assignment, and real-time progress tracking. IT Heads can now directly assign repair tasks to service providers through the system.",
        link: "/dashboard/repairs"
      },
      {
        id: "UPD-002", 
        title: "System Maintenance Scheduled",
        description: "Scheduled maintenance window on January 20th, 2025 from 2:00 AM to 4:00 AM GMT. Limited system availability expected.",
        type: "maintenance",
        priority: "medium",
        date: "2025-01-14T09:15:00Z",
        author: "IT Operations",
        isRead: false,
        category: "System Maintenance",
        tags: ["Maintenance", "Downtime", "Schedule"],
        content: "Our system will undergo routine maintenance to improve performance and security. During this time, some features may be temporarily unavailable. We apologize for any inconvenience."
      },
      {
        id: "UPD-003",
        title: "New Dashboard Layout Released",
        description: "Enhanced modern sidebar with collapsible design and improved navigation for better user experience.",
        type: "feature",
        priority: "medium",
        date: "2025-01-13T16:45:00Z",
        author: "UI/UX Team",
        isRead: true,
        category: "User Interface",
        tags: ["Dashboard", "UI", "Navigation"],
        content: "We've completely redesigned the dashboard with a modern, collapsible sidebar that adapts to your workflow. The new design provides better organization of features and improved accessibility.",
        link: "/dashboard"
      },
      {
        id: "UPD-004",
        title: "Security Enhancement: Two-Factor Authentication",
        description: "Two-factor authentication is now available for all users. Enable it in your account settings for enhanced security.",
        type: "security",
        priority: "high",
        date: "2025-01-12T11:20:00Z",
        author: "Security Team",
        isRead: true,
        category: "Security",
        tags: ["Security", "2FA", "Authentication"],
        content: "Protect your account with our new two-factor authentication feature. This adds an extra layer of security by requiring a verification code from your phone in addition to your password.",
        link: "/dashboard/settings"
      },
      {
        id: "UPD-005",
        title: "Improved Repair Tracking System",
        description: "Enhanced repair workflow with real-time status updates, cost tracking, and estimated completion dates.",
        type: "feature",
        priority: "medium",
        date: "2025-01-10T14:30:00Z",
        author: "Development Team",
        isRead: true,
        category: "Repairs",
        tags: ["Repairs", "Tracking", "Workflow"],
        content: "Our repair tracking system now provides comprehensive visibility into repair requests with real-time status updates, detailed cost breakdown, and accurate completion estimates."
      },
      {
        id: "UPD-006",
        title: "QCC IT System Policy Update",
        description: "Updated IT policies regarding device usage, data security, and remote work guidelines. All staff must review.",
        type: "announcement",
        priority: "critical",
        date: "2025-01-08T08:00:00Z",
        author: "HR Department",
        isRead: false,
        category: "Policy",
        tags: ["Policy", "Compliance", "Guidelines"],
        content: "Important updates to our IT policies include new guidelines for remote work, enhanced data security requirements, and updated device usage protocols. All employees must review and acknowledge these changes."
      }
    ]
    
    setUpdates(mockUpdates)
    setFilteredUpdates(mockUpdates)
  }, [])

  useEffect(() => {
    let filtered = updates

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(update => 
        update.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        update.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        update.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(update => update.type === typeFilter)
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(update => update.priority === priorityFilter)
    }

    setFilteredUpdates(filtered)
  }, [searchTerm, typeFilter, priorityFilter, updates])

  const markAsRead = (updateId: string) => {
    setUpdates(prev => 
      prev.map(update => 
        update.id === updateId ? { ...update, isRead: true } : update
      )
    )
  }

  const markAllAsRead = () => {
    setUpdates(prev => prev.map(update => ({ ...update, isRead: true })))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feature": return <Zap className="h-4 w-4" />
      case "maintenance": return <Clock className="h-4 w-4" />
      case "security": return <AlertCircle className="h-4 w-4" />
      case "announcement": return <Info className="h-4 w-4" />
      case "system": return <CheckCircle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "feature": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
      case "maintenance": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "security": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300"
      case "announcement": return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300"
      case "system": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300"
      default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300"
      case "high": return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300"
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "low": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300"
      default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const unreadCount = updates.filter(u => !u.isRead).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center shadow-lg">
            <Rss className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Updates</h1>
            <p className="text-muted-foreground">
              Stay informed about system changes, features, and announcements
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              <Bell className="h-3 w-3 mr-1" />
              {unreadCount} Unread
            </Badge>
          )}
          <Button 
            onClick={markAllAsRead}
            variant="outline"
            disabled={unreadCount === 0}
          >
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Rss className="h-4 w-4" />
              Total Updates
            </CardTitle>
            <div className="text-2xl font-bold">{updates.length}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Unread
            </CardTitle>
            <div className="text-2xl font-bold">{unreadCount}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Features
            </CardTitle>
            <div className="text-2xl font-bold">{updates.filter(u => u.type === "feature").length}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Security
            </CardTitle>
            <div className="text-2xl font-bold">{updates.filter(u => u.type === "security").length}</div>
          </CardHeader>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Info className="h-4 w-4" />
              Announcements
            </CardTitle>
            <div className="text-2xl font-bold">{updates.filter(u => u.type === "announcement").length}</div>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search updates, announcements, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="feature">Features</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="announcement">Announcements</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Updates List */}
      <div className="space-y-4">
        {filteredUpdates.map((update) => (
          <Card 
            key={update.id} 
            className={cn(
              "hover:shadow-md transition-shadow cursor-pointer",
              !update.isRead && "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
            )}
            onClick={() => {
              setSelectedUpdate(update)
              markAsRead(update.id)
            }}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {!update.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                      {getTypeIcon(update.type)}
                      {update.title}
                    </CardTitle>
                    <Badge className={getTypeColor(update.type)}>
                      {update.type}
                    </Badge>
                    <Badge className={getPriorityColor(update.priority)}>
                      {update.priority}
                    </Badge>
                  </div>
                  
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(update.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {update.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {update.category}
                    </span>
                  </CardDescription>
                </div>
                
                {update.link && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.location.href = update.link!
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{update.description}</p>
              
              {update.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {update.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="h-2 w-2 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUpdates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Rss className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Updates Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || typeFilter !== "all" || priorityFilter !== "all"
                ? "Try adjusting your filters or search terms."
                : "No system updates are available at the moment."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Update Detail Modal */}
      {selectedUpdate && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUpdate(null)}
        >
          <Card 
            className="max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    {getTypeIcon(selectedUpdate.type)}
                    {selectedUpdate.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(selectedUpdate.type)}>
                      {selectedUpdate.type}
                    </Badge>
                    <Badge className={getPriorityColor(selectedUpdate.priority)}>
                      {selectedUpdate.priority}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(selectedUpdate.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedUpdate.author}
                    </span>
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedUpdate(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {selectedUpdate.content && (
                <div>
                  <h4 className="font-medium mb-2">Details</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedUpdate.content}
                  </p>
                </div>
              )}
              
              {selectedUpdate.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedUpdate.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedUpdate.link && (
                <div className="pt-4 border-t">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                    onClick={() => window.location.href = selectedUpdate.link!}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Related Page
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}