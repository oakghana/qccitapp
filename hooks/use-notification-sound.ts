'use client'

import { useCallback, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ShowNotificationOptions {
  title: string
  description?: string
  type?: 'success' | 'error' | 'warning' | 'info' | 'notification'
  duration?: number
  sound?: boolean
}

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null)

  const playNotificationSound = useCallback(async () => {
    try {
      const audioContext =
        audioContextRef.current ||
        new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext

      const now = audioContext.currentTime

      // Create oscillators for notification sound
      const osc1 = audioContext.createOscillator()
      const osc2 = audioContext.createOscillator()
      const gain = audioContext.createGain()
      const filter = audioContext.createBiquadFilter()

      osc1.frequency.value = 800
      osc2.frequency.value = 1200
      filter.frequency.value = 1000

      gain.gain.setValueAtTime(0.3, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

      osc1.connect(filter)
      osc2.connect(filter)
      filter.connect(gain)
      gain.connect(audioContext.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.3)
      osc2.stop(now + 0.3)
    } catch (error) {
      console.error('Error playing notification sound:', error)
    }
  }, [])

  return { playNotificationSound }
}

export function useNotification() {
  const { toast } = useToast()
  const { playNotificationSound } = useNotificationSound()

  const showNotification = useCallback(
    async (options: ShowNotificationOptions) => {
      const {
        title,
        description,
        type = 'info',
        duration = 5000,
        sound = true,
      } = options

      if (sound) {
        await playNotificationSound()
      }

      toast({
        title,
        description,
        variant: type === 'notification' ? 'flash' : type,
        duration,
      })
    },
    [toast, playNotificationSound]
  )

  return { showNotification }
}
