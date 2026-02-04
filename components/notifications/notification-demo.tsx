"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useNotifications } from "@/lib/notification-context"
import { Bell, AlertCircle, CheckCircle2, Info } from "lucide-react"

export function NotificationDemo() {
  const { addNotification } = useNotifications()
  const [selectedType, setSelectedType] = useState<"success" | "info" | "warning" | "error">("success")
  const [selectedPriority, setSelectedPriority] = useState<"low" | "medium" | "high" | "urgent">("medium")

  const demoNotifications = {
    success: {
      title: "✅ Ticket Completed",
      message: "Your IT support request has been resolved successfully",
      action: "View Details",
    },
    info: {
      title: "🎯 New Task Assigned",
      message: "Device repair task has been assigned to your queue",
      action: "View Task",
    },
    warning: {
      title: "⚠️ Response Needed",
      message: "Your repair ticket requires additional information from you",
      action: "Provide Info",
    },
    error: {
      title: "❌ Action Required",
      message: "There was an issue processing your request",
      action: "Retry",
    },
  }

  const handleDemoNotification = () => {
    const demo = demoNotifications[selectedType]
    addNotification({
      title: demo.title,
      message: demo.message,
      type: selectedType,
      priority: selectedPriority,
      actionUrl: "/dashboard",
      actionLabel: demo.action,
    })
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 p-6">
        <div className="flex gap-3 mb-4">
          <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Modern Notification System</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
              Test the real-time notification system. Try different notification types and priorities to see how the system responds to various scenarios.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          {/* Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Notification Type
            </label>
            <div className="space-y-2">
              {(["success", "info", "warning", "error"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`w-full px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all text-left ${
                    selectedType === type
                      ? type === "success"
                        ? "border-green-500 bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100"
                        : type === "info"
                          ? "border-blue-500 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100"
                          : type === "warning"
                            ? "border-yellow-500 bg-yellow-100 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100"
                            : "border-red-500 bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {type === "success" && <CheckCircle2 className="w-4 h-4" />}
                    {type === "info" && <Info className="w-4 h-4" />}
                    {type === "warning" && <AlertCircle className="w-4 h-4" />}
                    {type === "error" && <AlertCircle className="w-4 h-4" />}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Priority Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Priority Level
            </label>
            <div className="space-y-2">
              {(["low", "medium", "high", "urgent"] as const).map((priority) => (
                <button
                  key={priority}
                  onClick={() => setSelectedPriority(priority)}
                  className={`w-full px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all text-left ${
                    selectedPriority === priority
                      ? priority === "urgent"
                        ? "border-red-500 bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100"
                        : priority === "high"
                          ? "border-orange-500 bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-100"
                          : priority === "medium"
                            ? "border-blue-500 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-100"
                            : "border-green-500 bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {priority === "urgent" && "⚡ "}
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={handleDemoNotification} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white">
          <Bell className="w-4 h-4 mr-2" />
          Send Test Notification
        </Button>
      </Card>

      {/* Features List */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">✨ Features</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Top-Center Position</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Notifications appear centered at the top</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Real-time Supabase Sync</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Instant updates via database subscriptions</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded">
              <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Manual Dismiss</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Users control when to close notifications</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded">
              <AlertCircle className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <p className="font-medium text-sm">Smooth Animations</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Spring physics for elegant interactions</p>
            </div>
          </div>
        </div>
      </Card>

      {/* How It Works */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">🔧 How It Works</h3>
        <div className="space-y-4 text-sm">
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium">Assignment Notification</p>
              <p className="text-gray-600 dark:text-gray-400">When IT staff is assigned a ticket, they receive an instant notification with priority level</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium">Status Updates</p>
              <p className="text-gray-600 dark:text-gray-400">Automatic notifications when ticket status changes (in-progress, on-hold, completed)</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium">Completion Acknowledgement</p>
              <p className="text-gray-600 dark:text-gray-400">Requesters get a beautiful modal to acknowledge work completion and provide feedback</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0">
              4
            </div>
            <div>
              <p className="font-medium">Manual Dismiss</p>
              <p className="text-gray-600 dark:text-gray-400">Users can dismiss notifications anytime with a click - no auto-timeout</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
