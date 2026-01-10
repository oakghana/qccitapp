"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, RefreshCw, CheckCircle, Clock, Wrench } from "lucide-react"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"

export function Analytics() {
  const [timeRange, setTimeRange] = useState("6months")
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [repairData, setRepairData] = useState<any[]>([])
  const [serviceDeskData, setServiceDeskData] = useState<any[]>([])
  const [deviceBreakdown, setDeviceBreakdown] = useState<any[]>([])
  const [totalRepairs, setTotalRepairs] = useState(0)
  const [totalServiceDesk, setTotalServiceDesk] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [avgResolutionTime, setAvgResolutionTime] = useState(0)

  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)

      const { data: repairs } = await supabase
        .from("repair_requests")
        .select("*")
        .order("created_at", { ascending: false })

      const { data: tickets } = await supabase.from("tickets").select("*").order("created_at", { ascending: false })

      const { data: devices } = await supabase.from("devices").select("type")

      // Process repairs count
      setTotalRepairs(repairs?.length || 0)
      setTotalServiceDesk(tickets?.length || 0)

      // Calculate costs from repairs
      const cost = repairs?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0
      setTotalCost(cost)

      // Calculate average resolution time from tickets
      const resolvedTickets = tickets?.filter((t) => t.status === "resolved") || []
      const avgTime =
        resolvedTickets.length > 0
          ? resolvedTickets.reduce((sum, t) => {
              const created = new Date(t.created_at)
              const resolved = new Date(t.resolved_at || t.updated_at)
              const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
              return sum + hours
            }, 0) / resolvedTickets.length
          : 0
      setAvgResolutionTime(avgTime)

      // Process device breakdown
      const deviceTypes = devices?.reduce((acc: any, d) => {
        const type = d.type || "Others"
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {})

      const deviceChart = Object.entries(deviceTypes || {}).map(([name, value], index) => ({
        name,
        value,
        color: ["#15803d", "#84cc16", "#eab308", "#f97316", "#6b7280"][index % 5],
      }))
      setDeviceBreakdown(deviceChart)
    } catch (error) {
      console.error("[v0] Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics & Reports</h2>
          <p className="text-muted-foreground">Comprehensive insights for planning and procurement</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repairs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRepairs}</div>
            <p className="text-xs text-muted-foreground">Repair requests tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Desk Tickets</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServiceDesk}</div>
            <p className="text-xs text-muted-foreground">Support tickets managed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₵{totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Repair costs incurred</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResolutionTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Average time to resolve</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Breakdown</CardTitle>
          <CardDescription>Device types requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
