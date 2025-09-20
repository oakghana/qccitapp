"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { 
  Download, 
  Smartphone, 
  X, 
  WifiOff, 
  Zap, 
  Bell, 
  Shield, 
  ArrowRight, 
  CheckCircle,
  Monitor,
  Tablet
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileAppDownloadProps {
  className?: string
  showOnLogin?: boolean
  autoShow?: boolean
}

export function MobileAppDownload({ className, showOnLogin = false, autoShow = false }: MobileAppDownloadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed the banner
    const hasBeenDismissed = localStorage.getItem('mobile-app-banner-dismissed') === 'true'
    setDismissed(hasBeenDismissed)

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for custom event from sidebar
    const handleShowMobileAppDownload = () => {
      setIsOpen(true)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
      
      // Auto show banner on login if not dismissed
      if (showOnLogin && !hasBeenDismissed) {
        setTimeout(() => {
          setShowBanner(true)
          if (autoShow) {
            setIsOpen(true)
          }
        }, 2000)
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setIsInstalled(true)
      setIsOpen(false)
      setShowBanner(false)
      localStorage.setItem('mobile-app-banner-dismissed', 'true')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('showMobileAppDownload', handleShowMobileAppDownload)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('showMobileAppDownload', handleShowMobileAppDownload)
    }
  }, [showOnLogin, autoShow])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      
      setDeferredPrompt(null)
      setIsOpen(false)
    } catch (error) {
      console.error('Error during installation:', error)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setIsOpen(false)
    setDismissed(true)
    localStorage.setItem('mobile-app-banner-dismissed', 'true')
  }

  const handleOpenDialog = () => {
    setIsOpen(true)
  }

  // Don't show if installed or permanently dismissed
  if (isInstalled || dismissed) {
    return null
  }

  return (
    <>
      {/* Banner Notification */}
      {showBanner && !dismissed && (
        <Card className={cn("border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 shadow-lg", className)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-full">
                  <Smartphone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                    Install QCC IT Tracker App
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Get offline access and push notifications
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={handleOpenDialog}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Learn More
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floating Download Button */}
      {!showBanner && isInstallable && !dismissed && (
        <Button
          onClick={handleOpenDialog}
          className="fixed bottom-4 right-4 z-50 bg-orange-600 hover:bg-orange-700 text-white shadow-lg rounded-full p-3 h-auto"
          size="sm"
        >
          <Download className="h-5 w-5 mr-2" />
          Install App
        </Button>
      )}

      {/* Detailed Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-900 dark:text-orange-100">
              <Smartphone className="h-6 w-6 text-orange-600" />
              Install QCC IT Tracker Mobile App
            </DialogTitle>
            <DialogDescription>
              Get the full mobile experience with offline access, push notifications, and native app performance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Installation Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
                <CardContent className="p-4 text-center">
                  <Monitor className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                  <h4 className="font-medium text-orange-900 dark:text-orange-100">Desktop</h4>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Chrome, Edge, Firefox</p>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
                <CardContent className="p-4 text-center">
                  <Smartphone className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                  <h4 className="font-medium text-orange-900 dark:text-orange-100">Mobile</h4>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Android, iOS Safari</p>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/30">
                <CardContent className="p-4 text-center">
                  <Tablet className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                  <h4 className="font-medium text-orange-900 dark:text-orange-100">Tablet</h4>
                  <p className="text-xs text-orange-600 dark:text-orange-400">iPad, Android tablets</p>
                </CardContent>
              </Card>
            </div>

            {/* Key Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                Why Install the Mobile App?
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <WifiOff className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-orange-900 dark:text-orange-100">Full Offline Access</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      View devices, repairs, and data even without internet connection
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <Bell className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-orange-900 dark:text-orange-100">Push Notifications</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Get instant alerts for repair updates and urgent issues
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <Zap className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-orange-900 dark:text-orange-100">Lightning Fast</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Native app performance with instant loading
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                  <Shield className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-orange-900 dark:text-orange-100">Secure & Private</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Your data stays secure with local caching and encryption
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Installation Instructions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                How to Install:
              </h3>
              
              <div className="space-y-2">
                {isInstallable ? (
                  <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      Your browser supports one-click installation!
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">1</Badge>
                      <span>Look for the install icon in your browser's address bar</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">2</Badge>
                      <span>Or use browser menu → "Install QCC IT Tracker"</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">3</Badge>
                      <span>The app will be added to your home screen/desktop</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* App Size and Info */}
            <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-orange-600 dark:text-orange-400">App Size:</span>
                    <span className="font-medium text-orange-900 dark:text-orange-100 ml-1">~2MB</span>
                  </div>
                  <div>
                    <span className="text-orange-600 dark:text-orange-400">Offline Storage:</span>
                    <span className="font-medium text-orange-900 dark:text-orange-100 ml-1">~50MB</span>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
                  PWA Certified
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleDismiss} className="order-2 sm:order-1">
              Maybe Later
            </Button>
            {isInstallable ? (
              <Button 
                onClick={handleInstallClick}
                className="bg-orange-600 hover:bg-orange-700 text-white order-1 sm:order-2"
              >
                <Download className="mr-2 h-4 w-4" />
                Install Now
              </Button>
            ) : (
              <Button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="bg-orange-600 hover:bg-orange-700 text-white order-1 sm:order-2"
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Open Installation Guide
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Hook for triggering mobile app download notification
export function useMobileAppDownload() {
  const [showNotification, setShowNotification] = useState(false)

  const triggerDownloadNotification = () => {
    setShowNotification(true)
  }

  const dismissNotification = () => {
    setShowNotification(false)
  }

  return {
    showNotification,
    triggerDownloadNotification,
    dismissNotification
  }
}