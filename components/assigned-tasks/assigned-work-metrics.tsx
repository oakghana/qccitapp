"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Clock, AlertCircle, Zap, TrendingUp, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"

interface WorkMetrics {
  total: number
  assigned: number
  inProgress: number
  completed: number
  onHold: number
  highPriority: number
  averageCompletionTime: number
  completionRate: number
}

interface TasksByType {
  repair: number
  serviceDesk: number
}

export function AssignedWorkMetrics() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<WorkMetrics>({
    total: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    onHold: 0,
    highPriority: 0,
    averageCompletionTime: 0,
    completionRate: 0,
  })
  const [tasksByType, setTasksByType] = useState<TasksByType>({ repair: 0, serviceDesk: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [user])

  const loadMetrics = async () => {
    if (!user) return

    try {
      setLoading(true)
      const userName = user.name || user.email || ""

      // Load service tickets
      const { data: tickets } = await supabase
        .from("service_tickets")
        .select("*")
        .or(`assigned_to.eq.${user.id},assigned_to_name.ilike.%${userName}%`)

      // Load repair requests
      const { data: repairs } = await supabase
        .from("repair_requests")
        .select("*")
        .or(`assigned_to.eq.${user.id},assigned_to_name.ilike.%${userName}%`)

      let totalAssigned = (tickets?.length || 0) + (repairs?.length || 0)
      let assigned = 0
      let inProgress = 0
      let completed = 0
      let onHold = 0
      let highPriority = 0
      let repairCount = 0
      let serviceDeskCount = 0

      // Process tickets
      tickets?.forEach((ticket: any) => {
        serviceDeskCount++
        if (ticket.status === "assigned") assigned++
        else if (ticket.status === "in_progress") inProgress++
        else if (ticket.status === "completed" || ticket.status === "resolved") completed++
        else if (ticket.status === "on_hold") onHold++
        if (ticket.priority === "high" || ticket.priority === "urgent") highPriority++
      })

      // Process repairs
      repairs?.forEach((repair: any) => {
        repairCount++
        if (repair.status === "assigned") assigned++
        else if (repair.status === "in_progress") inProgress++
        else if (repair.status === "completed") completed++
        else if (repair.status === "on_hold") onHold++
        if (repair.priority === "high" || repair.priority === "critical") highPriority++
      })

      const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0

      setMetrics({
        total: totalAssigned,
        assigned,
        inProgress,
        completed,
        onHold,
        highPriority,
        averageCompletionTime: 0, // Can be calculated if completion_date and created_at are available
        completionRate,
      })

      setTasksByType({
        repair: repairCount,
        serviceDesk: serviceDeskCount,
      })
    } catch (error) {
      console.error("[v0] Error loading metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-pulse">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium h-4 bg-muted rounded w-24"></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded w-12"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Tasks Card */}
          <Card className="bg-white rounded-lg shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                Total Assigned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-slate-800">{metrics.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Work items assigned to you</p>
            </CardContent>
          </Card>

          {/* In Progress Card */}
          <Card className="bg-white rounded-lg shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-slate-800">{metrics.inProgress}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently being worked on</p>
            </CardContent>
          </Card>

          {/* Completed Card */}
          <Card className="bg-white rounded-lg shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-slate-400" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-slate-800">{metrics.completed}</div>
              <div className="mt-2">
                <Progress value={metrics.completionRate} className="h-1.5" />
                <p className="text-xs text-muted-foreground mt-1">{metrics.completionRate}% completion rate</p>
              </div>
            </CardContent>
          </Card>

          {/* High Priority Card */}
          <Card className="bg-white rounded-lg shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-slate-400" />
                High Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-slate-800">{metrics.highPriority}</div>
              <p className="text-xs text-muted-foreground mt-1">Require immediate attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card className="bg-white rounded-lg shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Status Distribution</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Your work organized by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Assigned", value: metrics.assigned },
                { label: "In Progress", value: metrics.inProgress },
                { label: "On Hold", value: metrics.onHold },
                { label: "Completed", value: metrics.completed },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{s.label}</span>
                  <div className="flex items-center gap-3">
                    <Progress value={(s.value / (metrics.total || 1)) * 100} className="w-40 h-1.5" />
                    <span className="text-sm font-medium text-slate-700">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="breakdown" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Service Desk Tickets
              </CardTitle>
              <CardDescription>IT support tickets assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{tasksByType.serviceDesk}</div>
              <Badge className="mt-4">Active</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Repair Requests
              </CardTitle>
              <CardDescription>Device repair tasks assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">{tasksByType.repair}</div>
              <Badge className="mt-4">Active</Badge>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
