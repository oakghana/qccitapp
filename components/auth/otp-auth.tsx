"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "input-otp"
import { Loader2, Mail, MessageSquare, Shield, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface OTPAuthProps {
  onVerifySuccess: (token: string) => void
  onCancel: () => void
  phoneNumber?: string
  email?: string
  method: "sms" | "email"
}

interface OTPState {
  isLoading: boolean
  isVerifying: boolean
  otpSent: boolean
  otpCode: string
  timeLeft: number
  error: string | null
  success: boolean
}

export function OTPAuth({ onVerifySuccess, onCancel, phoneNumber, email, method }: OTPAuthProps) {
  const [state, setState] = useState<OTPState>({
    isLoading: false,
    isVerifying: false,
    otpSent: false,
    otpCode: "",
    timeLeft: 0,
    error: null,
    success: false,
  })

  // Timer for OTP expiry
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (state.timeLeft > 0) {
      interval = setInterval(() => {
        setState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [state.timeLeft])

  const sendOTP = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // Simulate API call to send OTP
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real app, you would make an API call here
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          phoneNumber,
          email,
        }),
      }).catch(() => {
        // Simulate successful OTP send for demo
        return { ok: true }
      })

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          otpSent: true,
          timeLeft: 300, // 5 minutes
        }))
      } else {
        throw new Error('Failed to send OTP')
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to send OTP. Please try again.',
      }))
    }
  }

  const verifyOTP = async () => {
    if (state.otpCode.length !== 6) {
      setState(prev => ({ ...prev, error: 'Please enter a valid 6-digit code' }))
      return
    }

    setState(prev => ({ ...prev, isVerifying: true, error: null }))

    try {
      // Simulate API call to verify OTP
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real app, you would make an API call here
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          phoneNumber,
          email,
          otpCode: state.otpCode,
        }),
      }).catch(() => {
        // Simulate successful verification for demo (accept any 6-digit code)
        return { ok: true, json: () => Promise.resolve({ token: 'demo-token-123' }) }
      })

      if (response.ok) {
        const data = await response.json()
        setState(prev => ({ ...prev, isVerifying: false, success: true }))
        
        // Wait a moment to show success state
        setTimeout(() => {
          onVerifySuccess(data.token || 'demo-token-123')
        }, 1500)
      } else {
        throw new Error('Invalid OTP code')
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isVerifying: false,
        error: 'Invalid OTP code. Please try again.',
      }))
    }
  }

  const resendOTP = () => {
    setState(prev => ({
      ...prev,
      otpSent: false,
      otpCode: "",
      timeLeft: 0,
      error: null,
    }))
    sendOTP()
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (state.success) {
    return (
      <Card className="w-full max-w-md mx-auto border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <CheckCircle className="h-16 w-16 text-orange-600 dark:text-orange-400 mb-4" />
          <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
            Verification Successful!
          </h3>
          <p className="text-orange-600 dark:text-orange-400 text-center">
            You will be redirected to your dashboard shortly.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          {method === "sms" ? (
            <MessageSquare className="h-6 w-6 text-primary" />
          ) : (
            <Mail className="h-6 w-6 text-primary" />
          )}
        </div>
        <CardTitle className="text-2xl font-bold">Verify Your Identity</CardTitle>
        <CardDescription>
          {state.otpSent ? (
            <>
              We've sent a 6-digit code to{" "}
              <span className="font-medium">
                {method === "sms" ? phoneNumber : email}
              </span>
            </>
          ) : (
            `We'll send a verification code to your ${method === "sms" ? "phone" : "email"}`
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {state.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {!state.otpSent ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to receive your verification code
              </p>
              <Button
                onClick={sendOTP}
                disabled={state.isLoading}
                className="w-full"
                size="lg"
              >
                {state.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Send Verification Code
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-center block">
                Enter Verification Code
              </Label>
              <div className="flex justify-center">
                <InputOTP
                  value={state.otpCode}
                  onChange={(value: string) => setState(prev => ({ ...prev, otpCode: value, error: null }))}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {state.timeLeft > 0 && (
              <div className="text-center">
                <Badge variant="outline" className="text-xs">
                  Code expires in {formatTime(state.timeLeft)}
                </Badge>
              </div>
            )}

            <Button
              onClick={verifyOTP}
              disabled={state.isVerifying || state.otpCode.length !== 6}
              className="w-full"
              size="lg"
            >
              {state.isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>

            <div className="text-center space-y-2">
              {state.timeLeft === 0 ? (
                <Button
                  variant="ghost"
                  onClick={resendOTP}
                  disabled={state.isLoading}
                  className="text-sm"
                >
                  Resend Code
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Didn't receive the code? Wait {formatTime(state.timeLeft)} to resend
                </p>
              )}
              
              <Button
                variant="ghost"
                onClick={onCancel}
                className="text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Hook for OTP authentication
export function useOTPAuth() {
  const [isOTPRequired, setIsOTPRequired] = useState(false)
  const [otpMethod, setOTPMethod] = useState<"sms" | "email">("sms")

  const requestOTP = (method: "sms" | "email") => {
    setOTPMethod(method)
    setIsOTPRequired(true)
  }

  const cancelOTP = () => {
    setIsOTPRequired(false)
  }

  return {
    isOTPRequired,
    otpMethod,
    requestOTP,
    cancelOTP,
  }
}