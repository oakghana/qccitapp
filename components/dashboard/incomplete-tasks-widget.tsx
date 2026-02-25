"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, ExternalLink, Wrench } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface IncompleteTask {
  id: string
  device_id: string
  device_name: string
  issue: string
  status: string
  priority: string
  created_at: string
  daysOpen: number
  isOverdue: boolean
}

export function IncompleteTasksWidget() {
  const { user } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<IncompleteTask[]>([])
  const [loading, setLoading] = useState(true)

  // Only show for IT staff roles
  const isITStaff = user?.role === "it_staff" || user?.role === "it_head" || user?.role === "regional_it_head"

  useEffect(() => {
    if (!isITStaff || !user) return

    const loadIncompleteTasks = async () => {
      try {
        const supabase = createClient()
        
        // Fetch incomplete tasks assigned to this user.
        // Note: the Postgres enum for repair status uses values like
        // 'assigned' and 'in_repair' (not 'in_progress'). Query only
        // valid enum values to avoid DB errors (22P02).
        // Fetch repair requests assigned to the user without passing an enum
        // list to Postgres (some deployments use different enum values).
        // We'll fetch recent assigned repairs and filter client-side to avoid
        // invalid-enum SQL errors (22P02).
        const { data, error } = await supabase
          .from("repair_requests")
          .select("*")
          .eq("assigned_to", user.id)
          .order("created_at", { ascending: true })
          .limit(20)

        // Supabase may return an error object that is empty ({}). Treat only
        // meaningful errors as failures to avoid noisy console output.
        if (error && (error.message || Object.keys(error).length > 0)) {
          try {
            console.error("[v0] Error loading incomplete tasks:", JSON.stringify(error))
          } catch (e) {
            console.error("[v0] Error loading incomplete tasks:", error)
          }
          return
        } else if (error) {
          // Empty error object, log a debug message at info level instead of error
          console.info("[v0] Incomplete tasks returned empty error object; continuing.", error)
        }

        // Calculate days open and check if overdue. Filter to only include
        // statuses that represent incomplete work (we check keywords to be
        // resilient to enum differences across databases).
        const now = new Date()
        const incompleteStatusKeywords = ["pending", "in_progress", "in_repair", "assigned", "pickup", "collected", "diagnos"]

        const tasksWithMeta = (data || [])
          .filter((task: any) => {
            const status = (task.status || "").toString().toLowerCase()
            return incompleteStatusKeywords.some((kw) => status.includes(kw))
          })
          .map((task) => {
          const createdDate = new Date(task.created_at)
          const daysOpen = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
          
          // Determine if overdue based on priority
          let expectedDays = 10 // Low priority default
          if (task.priority === "critical") expectedDays = 1
          else if (task.priority === "high") expectedDays = 3
          else if (task.priority === "medium") expectedDays = 5

          return {
            id: task.id,
            device_id: task.device_id,
            device_name: task.device_name || "Unknown Device",
            issue: task.issue || "No description",
            status: task.status,
            priority: task.priority,
            created_at: task.created_at,
            daysOpen,
            isOverdue: daysOpen > expectedDays,
          }
        }) || []

        setTasks(tasksWithMeta)
      } catch (error) {
        console.error("[v0] Error loading incomplete tasks:", error)
      } finally {
        setLoading(false)
      }
    }

    loadIncompleteTasks()

    // Refresh every minute
    const interval = setInterval(loadIncompleteTasks, 60000)
    return () => clearInterval(interval)
  }, [user, isITStaff])

  if (!isITStaff || loading) return null
  if (tasks.length === 0) return null

  const overdueCount = tasks.filter((t) => t.isOverdue).length
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Incomplete Tasks
            </CardTitle>
            <CardDescription>
              {overdueCount > 0 
                ? `${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''} require attention` 
                : "Tasks assigned to you"
              }
            </CardDescription>
          </div>
          <Badge variant={overdueCount > 0 ? "destructive" : "secondary"}>
            {tasks.length} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Task List */}
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`p-3 rounded-lg border ${
              task.isOverdue ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800" : "bg-muted/50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Wrench className={`h-3 w-3 ${task.isOverdue ? "text-red-600" : "text-muted-foreground"}`} />
                  <p className="text-sm font-medium truncate">{task.device_name}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                  {task.issue}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                    {task.priority}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{task.daysOpen} days open</span>
                  </div>
                  {task.isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* View All Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full gap-2 mt-2"
          onClick={() => router.push('/dashboard/assigned-tasks')}
        >
          <ExternalLink className="h-4 w-4" />
          View All Assigned Tasks
        </Button>
      </CardContent>
    </Card>
  )
}
