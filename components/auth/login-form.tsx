"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, Lock, Mail, ArrowRight, Leaf } from "lucide-react"

interface LoginFormData {
  username: string
  password: string
  otp: string
}

export function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
    otp: "",
  })
  const [step, setStep] = useState<"credentials" | "otp">("credentials")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (formData.username === "ohemengappiah@qccgh.com" && formData.password === "ghana") {
        setStep("otp")
      } else {
        setError("Invalid credentials. Access denied.")
      }
    } catch (err) {
      setError("Authentication failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (formData.otp.length === 6) {
        if (typeof window !== "undefined") {
          localStorage.setItem("pendingLogin", formData.username)
          localStorage.setItem("showMobileAppDownload", "true")
        }
        window.location.href = "/dashboard"
      } else {
        setError("Invalid OTP. Please check and try again.")
      }
    } catch (err) {
      setError("OTP verification failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3 lg:hidden">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
            <Leaf className="h-10 w-10 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            QCC IT Tracker
          </h1>
          <p className="text-sm text-muted-foreground">Ghana Community Network Services</p>
        </div>
      </div>

      <Card className="w-full border-2 border-green-200 dark:border-green-800 shadow-xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/50 dark:to-emerald-950/50">
        <CardHeader className="space-y-4 pb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 shadow-lg">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {step === "credentials" ? "Secure Access" : "Verify Your Identity"}
            </CardTitle>
            <CardDescription className="text-base">
              {step === "credentials"
                ? "Sign in to access your IT management dashboard"
                : "Enter the 6-digit verification code"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-2">
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          {step === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600 dark:text-green-400" />
                  <Input
                    id="username"
                    type="email"
                    placeholder="your.email@qccgh.com"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className="pl-11 h-12 text-base border-green-300 dark:border-green-700 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600 dark:text-green-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-11 h-12 text-base border-green-300 dark:border-green-700 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 shadow-lg text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="text-center pt-4 border-t border-green-200 dark:border-green-800">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <a
                    href="/register"
                    className="font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:underline"
                  >
                    Create Account
                  </a>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-semibold text-green-700 dark:text-green-300">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={formData.otp}
                  onChange={(e) => handleInputChange("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-[0.5em] h-14 font-bold border-green-300 dark:border-green-700 focus:border-green-500 focus:ring-green-500"
                  maxLength={6}
                  required
                />
              </div>

              <div className="text-center p-4 bg-gradient-to-r from-yellow-50 via-green-50 to-emerald-50 dark:from-yellow-950 dark:via-green-950 dark:to-emerald-950 rounded-lg border-2 border-green-200 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  Demo Code:{" "}
                  <span className="font-mono font-bold text-lg text-green-600 dark:text-green-400">123456</span>
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-12 text-base font-semibold border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950 bg-transparent"
                  onClick={() => setStep("credentials")}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 shadow-lg text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Sign In"
                  )}
                </Button>
              </div>

              <div className="text-center">
                <Button
                  variant="link"
                  className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                >
                  Didn't receive code? Resend
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
