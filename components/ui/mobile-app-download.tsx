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
    if (!deferredPrompt) {
      // If no prompt available, provide device-specific instructions
      const userAgent = navigator.userAgent.toLowerCase()
      let message = ''
      
      if (userAgent.includes('android')) {
        message = '📱 Android: Open Chrome menu (⋮) → "Add to Home Screen" or "Install App"'
      } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        message = '📱 iOS: Open in Safari → Share button (⬆️) → "Add to Home Screen"'
      } else if (userAgent.includes('chrome')) {
        message = '💻 Desktop: Look for install icon (⊞) in address bar or Chrome menu → "Install QCC IT Tracker"'
      } else if (userAgent.includes('firefox')) {
        message = '💻 Firefox: Click address bar icon or menu → "Install QCC IT Tracker"'
      } else if (userAgent.includes('edge')) {
        message = '💻 Edge: Click install icon in address bar or menu → "Apps" → "Install QCC IT Tracker"'
      } else {
        message = '💻 Look for install icon in browser address bar or check browser menu for "Install" option'
      }
      
      alert(message)
      return
    }

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
        <Card className={cn("border-green-200 bg-gradient-to-r from-green-50 via-emerald-50 to-orange-50 dark:from-green-950/50 dark:via-emerald-950/50 dark:to-orange-950/50 shadow-lg", className)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-800 dark:to-emerald-800 rounded-full">
                  <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    📱 Get the QCC IT Tracker App
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Install for offline access & notifications
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={isInstallable ? handleInstallClick : handleOpenDialog}
                  size="sm"
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                >
                  {isInstallable ? (
                    <>
                      <Download className="mr-1 h-3 w-3" />
                      Install Now
                    </>
                  ) : (
                    <>
                      <Smartphone className="mr-1 h-3 w-3" />
                      Get App
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
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
          className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-green-600 via-emerald-600 to-orange-600 hover:from-green-700 hover:via-emerald-700 hover:to-orange-700 text-white shadow-lg rounded-full p-3 h-auto animate-pulse hover:animate-none"
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
            <DialogTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
              <Smartphone className="h-6 w-6 text-green-600" />
              Install QCC IT Tracker Mobile App
            </DialogTitle>
            <DialogDescription>
              Get the full mobile experience with offline access, push notifications, and native app performance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Installation Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardContent className="p-4 text-center">
                  <Monitor className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <h4 className="font-medium text-green-900 dark:text-green-100">Desktop</h4>
                  <p className="text-xs text-green-600 dark:text-green-400">Chrome, Edge, Firefox</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardContent className="p-4 text-center">
                  <Smartphone className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <h4 className="font-medium text-green-900 dark:text-green-100">Mobile</h4>
                  <p className="text-xs text-green-600 dark:text-green-400">Android, iOS Safari</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                <CardContent className="p-4 text-center">
                  <Tablet className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <h4 className="font-medium text-green-900 dark:text-green-100">Tablet</h4>
                  <p className="text-xs text-green-600 dark:text-green-400">iPad, Android tablets</p>
                </CardContent>
              </Card>
            </div>

            {/* Key Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Why Install the Mobile App?
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg">
                  <WifiOff className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Full Offline Access</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      View devices, repairs, and data even without internet connection
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg">
                  <Bell className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Push Notifications</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Get instant alerts for repair updates and urgent issues
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg">
                  <Zap className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Lightning Fast</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Native app performance with instant loading
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Secure & Private</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your data stays secure with local caching and encryption
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Installation Instructions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                Quick Installation:
              </h3>
              
              <div className="space-y-2">
                {isInstallable ? (
                  <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                      Ready to install! Click the button below to add to your device.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex flex-col items-center text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <Smartphone className="h-8 w-8 text-green-600 mb-2" />
                        <h4 className="font-medium text-green-900 dark:text-green-100 text-sm">Android</h4>
                        <p className="text-xs text-green-700 dark:text-green-300">Chrome Menu → "Add to Home Screen"</p>
                      </div>
                      
                      <div className="flex flex-col items-center text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <Monitor className="h-8 w-8 text-green-600 mb-2" />
                        <h4 className="font-medium text-green-900 dark:text-green-100 text-sm">Desktop</h4>
                        <p className="text-xs text-green-700 dark:text-green-300">Look for install icon (⊞) in address bar</p>
                      </div>
                      
                      <div className="flex flex-col items-center text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <Tablet className="h-8 w-8 text-green-600 mb-2" />
                        <h4 className="font-medium text-green-900 dark:text-green-100 text-sm">iOS Safari</h4>
                        <p className="text-xs text-green-700 dark:text-green-300">Share → "Add to Home Screen"</p>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Don't see the install option? Try the "Download App" button below for device-specific instructions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* App Size and Info */}
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-orange-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-orange-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-green-600 dark:text-green-400">App Size:</span>
                    <span className="font-medium text-green-900 dark:text-green-100 ml-1">~2MB</span>
                  </div>
                  <div>
                    <span className="text-green-600 dark:text-green-400">Offline Storage:</span>
                    <span className="font-medium text-green-900 dark:text-green-100 ml-1">~50MB</span>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200">
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
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white order-1 sm:order-2"
              >
                <Download className="mr-2 h-4 w-4" />
                Install App
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 order-1 sm:order-2">
                <Button 
                  onClick={() => {
                    // Try to trigger install prompt manually
                    if ('beforeinstallprompt' in window) {
                      window.location.reload()
                    } else {
                      // For browsers that don't support PWA, provide direct options
                      const userAgent = navigator.userAgent.toLowerCase()
                      if (userAgent.includes('android')) {
                        alert('To install: Open in Chrome → Menu (⋮) → "Add to Home Screen" or "Install App"')
                      } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
                        alert('To install: Open in Safari → Share (⬆️) → "Add to Home Screen"')
                      } else {
                        alert('To install: Look for install icon (⊞) in your browser\'s address bar, or use browser menu → "Install QCC IT Tracker"')
                      }
                    }
                  }}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download App
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Copy current URL to clipboard for easy sharing/bookmarking
                    navigator.clipboard?.writeText(window.location.href)
                    alert('App link copied! You can bookmark this page or share it to install later.')
                  }}
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Get Install Link
                </Button>
              </div>
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
