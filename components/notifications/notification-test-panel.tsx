'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { notificationService } from '@/lib/notification-service'
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Zap } from 'lucide-react'

interface NotificationTestPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationTestPanel({ open, onOpenChange }: NotificationTestPanelProps) {
  const [testResult, setTestResult] = useState<string>('')

  const testNotifications = [
    {
      name: 'Success',
      icon: CheckCircle2,
      color: 'text-green-600',
      action: () => {
        notificationService.success(
          'Success Notification',
          'This is a success notification with a positive message.'
        )
        setTestResult('Success notification sent!')
      },
    },
    {
      name: 'Error',
      icon: AlertCircle,
      color: 'text-red-600',
      action: () => {
        notificationService.error(
          'Error Notification',
          'This is an error notification indicating something went wrong.'
        )
        setTestResult('Error notification sent!')
      },
    },
    {
      name: 'Warning',
      icon: AlertTriangle,
      color: 'text-amber-600',
      action: () => {
        notificationService.warning(
          'Warning Notification',
          'This is a warning notification alerting the user.'
        )
        setTestResult('Warning notification sent!')
      },
    },
    {
      name: 'Info',
      icon: Info,
      color: 'text-blue-600',
      action: () => {
        notificationService.info(
          'Info Notification',
          'This is an informational notification providing useful information.'
        )
        setTestResult('Info notification sent!')
      },
    },
    {
      name: 'Flash',
      icon: Zap,
      color: 'text-purple-600',
      action: () => {
        notificationService.flash(
          'Flash Notification',
          'This is a flash notification for important updates.'
        )
        setTestResult('Flash notification sent!')
      },
    },
  ]

  const testTaskNotifications = [
    {
      name: 'Task Completed',
      action: () => {
        notificationService.taskCompleted(
          'Device Reallocation',
          'John Doe'
        )
        setTestResult('Task completed notification sent!')
      },
    },
    {
      name: 'Task Assigned',
      action: () => {
        notificationService.taskAssigned(
          'Device Inventory Update',
          'High'
        )
        setTestResult('Task assigned notification sent!')
      },
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Notification Test Panel</DialogTitle>
          <DialogDescription>
            Test all notification types to verify they work correctly
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Basic Notifications */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Basic Notifications</h3>
            <div className="grid grid-cols-2 gap-2">
              {testNotifications.map(({ name, icon: Icon, color, action }) => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  onClick={action}
                  className="justify-start gap-2"
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* Task Notifications */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Task Notifications</h3>
            <div className="grid grid-cols-2 gap-2">
              {testTaskNotifications.map(({ name, action }) => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  onClick={action}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* Multi-notification Test */}
          <div>
            <h3 className="font-semibold text-sm mb-2">Multi-Notification Test</h3>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                notificationService.success('Step 1', 'Operation started')
                setTimeout(() => {
                  notificationService.info('Step 2', 'Processing data...')
                }, 500)
                setTimeout(() => {
                  notificationService.success('Step 3', 'Operation completed successfully!')
                }, 1500)
                setTestResult('Multi-step notification sequence sent!')
              }}
            >
              Run Multi-Step Test
            </Button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">{testResult}</p>
            </div>
          )}

          {/* Expected Behavior */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            <h4 className="font-semibold text-sm text-blue-900">Expected Behavior</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Success: Green toast, auto-disappears after 5s</li>
              <li>• Error: Red toast, auto-disappears after 7s</li>
              <li>• Warning: Amber toast, auto-disappears after 6s</li>
              <li>• Info: Blue toast, auto-disappears after 5s</li>
              <li>• Flash: Purple toast with animation, auto-disappears after 8s</li>
              <li>• Notifications appear in the bottom right corner</li>
              <li>• Multiple notifications stack properly</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
