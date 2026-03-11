'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast'
import { Bell, CheckCircle2, AlertCircle, Info, Volume2, VolumeX } from 'lucide-react'

interface NotificationToastProps {
  id: string
  title: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info' | 'notification'
  duration?: number
  onClose?: () => void
  sound?: boolean
  enableSoundToggle?: boolean
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  title,
  description,
  type = 'notification',
  duration = 5000,
  onClose,
  sound = true,
  enableSoundToggle = true,
}) => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(sound)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (isSoundEnabled) {
      playNotificationSound()
    }
  }, [isSoundEnabled])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const playNotificationSound = () => {
    // Create a simple notification sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const now = audioContext.currentTime

    // Create two oscillators for a pleasant notification sound
    const osc1 = audioContext.createOscillator()
    const osc2 = audioContext.createOscillator()
    const gain = audioContext.createGain()

    osc1.frequency.value = 800
    osc2.frequency.value = 1200
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(audioContext.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.3)
    osc2.stop(now + 0.3)
  }

  const getVariant = () => {
    const variantMap = {
      success: 'success',
      error: 'error',
      warning: 'warning',
      info: 'info',
      notification: 'flash',
    }
    return variantMap[type]
  }

  const getIcon = () => {
    const iconMap = {
      success: CheckCircle2,
      error: AlertCircle,
      warning: AlertCircle,
      info: Info,
      notification: Bell,
    }
    return iconMap[type]
  }

  if (!isOpen) return null

  const IconComponent = getIcon()

  return (
    <Toast
      variant={getVariant() as any}
      className="group glass-effect backdrop-blur-xl border border-white/20 shadow-2xl animate-in slide-in-from-top-full duration-300"
    >
      <div className="flex items-start gap-3 flex-1">
        <div className="mt-0.5 flex-shrink-0 animate-pulse">
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <ToastTitle className="font-bold tracking-tight">{title}</ToastTitle>
          {description && <ToastDescription>{description}</ToastDescription>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {enableSoundToggle && (
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            aria-label={isSoundEnabled ? 'Mute notification' : 'Unmute notification'}
          >
            {isSoundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <ToastClose />
      <audio ref={audioRef} />
    </Toast>
  )
}
