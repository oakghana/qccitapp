"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, BarChart3, PieChart, TrendingUp, Calendar } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export function Reports() {
  const supabase = createClient()
  const [reportsGenerated, setReportsGenerated] = useState(0)
  const [scheduledReports, setScheduledReports] = useState(0)
  const [dataPoints, setDataPoints] = useState(0)

  useEffect(() => {
    loadReportStats()
  }, [])

  const loadReportStats = async () => {
    const { data: repairs } = await supabase.from("repair_requests").select("id")
    const { data: devices } = await supabase.from("devices").select("id")
    const { data: tickets } = await supabase.from("tickets").select("id")

    const totalDataPoints = (repairs?.length || 0) + (devices?.length || 0) + (tickets?.length || 0)

    setReportsGenerated(repairs?.length || 0)
    setDataPoints(totalDataPoints)
  }

  const availableReports = [
    {
      id: "device-inventory",
      name: "Device Inventory Report",
      description: "Complete list of all devices with current status and assignments",
      category: "Inventory",
      lastGenerated: "2024-03-01",
      format: ["PDF", "Excel", "CSV"],
    },
    {
      id: "repair-summary",
      name: "Repair Summary Report",
      description: "Monthly summary of repair requests, completion rates, and service provider performance",
      category: "Repairs",
      lastGenerated: "2024-03-01",
      format: ["PDF", "Excel"],
    },
    {
      id: "user-activity",
      name: "User Activity Report",
      description: "User login patterns, device usage, and system interaction statistics",
      category: "Users",
      lastGenerated: "2024-02-28",
      format: ["PDF", "CSV"],
    },
    {
      id: "service-provider-performance",
      name: "Service Provider Performance",
      description: "Detailed analysis of service provider repair times, quality ratings, and SLA compliance",
      category: "Providers",
      lastGenerated: "2024-02-28",
      format: ["PDF", "Excel"],
    },
    {
      id: "regional-analysis",
      name: "Regional Analysis Report",
      description: "Device distribution, repair patterns, and resource utilization by office location",
      category: "Analytics",
      lastGenerated: "2024-02-25",
      format: ["PDF", "Excel"],
    },
    {
      id: "cost-analysis",
      name: "Cost Analysis Report",
      description: "Repair costs, service provider expenses, and budget utilization analysis",
      category: "Finance",
      lastGenerated: "2024-02-20",
      format: ["PDF", "Excel"],
    },
  ]

  const categoryColors = {
    Inventory: "default",
    Repairs: "secondary",
    Users: "outline",
    Providers: "secondary",
    Analytics: "default",
    Finance: "destructive",
  } as const

  const categoryIcons = {
    Inventory: BarChart3,
    Repairs: FileText,
    Users: TrendingUp,
    Providers: PieChart,
    Analytics: BarChart3,
    Finance: TrendingUp,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports & Analytics</h2>
          <p className="text-muted-foreground">Generate and download system reports</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="repairs">Repairs</SelectItem>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="providers">Providers</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reports Generated</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsGenerated}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Reports</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledReports}</div>
            <p className="text-xs text-muted-foreground">Auto-generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Tracked metrics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Export Formats</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">PDF, Excel, CSV</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <div className="grid gap-4">
        {availableReports.map((report) => {
          const CategoryIcon = categoryIcons[report.category as keyof typeof categoryIcons]

          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CategoryIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <CardDescription className="mt-1">{report.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={categoryColors[report.category as keyof typeof categoryColors]}>
                    {report.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Last generated: {new Date(report.lastGenerated).toLocaleDateString()}</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <span>Formats:</span>
                      {report.format.map((format) => (
                        <Badge key={format} variant="outline" className="text-xs">
                          {format}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Schedule
                    </Button>
                    <Button size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Generate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
