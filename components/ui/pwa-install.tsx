"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Smartphone, X, Check, WifiOff, Zap } from "lucide-react"
import { cn, safeStorage } from "@/lib/utils"

interface PWAInstallProps {
  className?: string
}

export function PWAInstall({ className }: PWAInstallProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      setIsInstallable(true)
      
      // Show our custom prompt after a delay
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Service worker registration is intentionally disabled here to avoid stale cached bundles

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (isInstalled) {
    return (
      <Card className={cn("border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:bg-gradient-to-br dark:from-green-950 dark:to-emerald-950", className)}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
            <Check className="h-5 w-5" />
            <span className="font-medium">App installed successfully!</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!showPrompt || !isInstallable) {
    return null
  }

  return (
    <Card className={cn("border-primary/20 bg-gradient-to-br from-orange-50 to-amber-50 dark:bg-gradient-to-br dark:from-orange-950 dark:to-amber-950", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Install Mobile App</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 text-xs">
              PWA
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Install QCC IT Device Tracker as a mobile app for quick access and full offline functionality.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Zap className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-orange-600" />
              )}
              <span className="text-sm font-medium">
                {isOnline ? "Online" : "Offline Mode"}
              </span>
            </div>
            <Badge variant={isOnline ? "default" : "secondary"} className={isOnline ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" : "text-xs"}>
              {isOnline ? "Connected" : "Cached Data Available"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-3 w-3 text-green-500" />
              <span>Full offline support</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-3 w-3 text-green-600" />
              <span>Lightning fast</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Push notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <Smartphone className="h-3 w-3 text-green-500" />
              <span>Native app feel</span>
            </div>
          </div>
          
          <Button 
            onClick={handleInstallClick} 
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            size="lg"
          >
            <Download className="mr-2 h-4 w-4" />
            Install App
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Hook to check if PWA is installed
export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Check if installable
    const handleBeforeInstallPrompt = () => {
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  return { isInstalled, isInstallable }
}
