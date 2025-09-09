"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  BookOpen,
  Monitor,
  Wifi,
  Smartphone,
  Printer,
  Shield,
  HelpCircle,
  ChevronRight,
  Star,
  ThumbsUp,
} from "lucide-react"

export function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState("")

  const categories = [
    { id: "hardware", name: "Hardware", icon: Monitor, count: 15 },
    { id: "software", name: "Software", icon: Smartphone, count: 23 },
    { id: "network", name: "Network", icon: Wifi, count: 12 },
    { id: "security", name: "Security", icon: Shield, count: 8 },
    { id: "printer", name: "Printers", icon: Printer, count: 6 },
    { id: "general", name: "General", icon: HelpCircle, count: 10 },
  ]

  const popularArticles = [
    {
      id: 1,
      title: "How to Reset Your Password",
      category: "Security",
      views: 245,
      rating: 4.8,
      description: "Step-by-step guide to reset your QCC system password",
    },
    {
      id: 2,
      title: "Fixing Common Email Issues",
      category: "Software",
      views: 189,
      rating: 4.6,
      description: "Troubleshoot Outlook and email connectivity problems",
    },
    {
      id: 3,
      title: "Connecting to Office WiFi",
      category: "Network",
      views: 156,
      rating: 4.7,
      description: "How to connect your device to the office wireless network",
    },
    {
      id: 4,
      title: "Printer Setup and Troubleshooting",
      category: "Hardware",
      views: 134,
      rating: 4.5,
      description: "Install and fix common printer issues",
    },
  ]

  const recentArticles = [
    {
      id: 5,
      title: "New VPN Setup Instructions",
      category: "Network",
      dateAdded: "2024-01-10",
      description: "Updated VPN configuration for remote access",
    },
    {
      id: 6,
      title: "Microsoft Teams Best Practices",
      category: "Software",
      dateAdded: "2024-01-08",
      description: "Tips for effective video conferencing and collaboration",
    },
    {
      id: 7,
      title: "Mobile Device Security Guidelines",
      category: "Security",
      dateAdded: "2024-01-05",
      description: "Protect your smartphone and tablet from security threats",
    },
  ]

  const quickSolutions = [
    {
      problem: "Computer is running slowly",
      solution: "Restart your computer, close unnecessary programs, run disk cleanup",
      category: "Hardware",
    },
    {
      problem: "Can't connect to internet",
      solution: "Check cable connections, restart router, contact IT if issue persists",
      category: "Network",
    },
    {
      problem: "Forgot my password",
      solution: "Use the password reset link on login page or contact IT help desk",
      category: "Security",
    },
    {
      problem: "Printer won't print",
      solution: "Check paper and ink levels, restart printer, verify connection",
      category: "Hardware",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base</CardTitle>
          <CardDescription>Find solutions to common IT issues and learn best practices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for solutions, guides, and tutorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Categories</TabsTrigger>
          <TabsTrigger value="popular">Popular Articles</TabsTrigger>
          <TabsTrigger value="quick">Quick Solutions</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Categories Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const IconComponent = category.icon
              return (
                <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">{category.count} articles</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Recent Articles */}
          <Card>
            <CardHeader>
              <CardTitle>Recently Added</CardTitle>
              <CardDescription>Latest knowledge base articles and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentArticles.map((article) => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-medium">{article.title}</h4>
                        <p className="text-sm text-muted-foreground">{article.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{article.category}</Badge>
                      <span className="text-sm text-muted-foreground">{article.dateAdded}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {popularArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary">{article.category}</Badge>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{article.rating}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{article.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{article.description}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{article.views} views</span>
                    <Button variant="ghost" size="sm">
                      Read More
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quick" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Solutions</CardTitle>
              <CardDescription>Common problems and their immediate solutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quickSolutions.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-destructive">Problem: {item.problem}</h4>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      <strong>Solution:</strong> {item.solution}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="mr-1 h-3 w-3" />
                        Helpful
                      </Button>
                      <Button variant="ghost" size="sm">
                        More Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
