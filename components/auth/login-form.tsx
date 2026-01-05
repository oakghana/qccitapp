"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, Lock, Mail, ArrowRight, Leaf } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface LoginFormData {
  username: string
  password: string
}

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Invalid credentials. Please try again.")
        return
      }

      if (login(formData.username)) {
        const role = data.user.role
        if (role === "admin") {
          router.push("/dashboard/admin")
        } else if (role === "it_head" || role === "regional_it_head") {
          router.push("/dashboard")
        } else if (role === "it_store_head") {
          router.push("/dashboard/store-inventory")
        } else if (role === "it_staff") {
          router.push("/dashboard/assigned-tasks")
        } else if (role === "staff") {
          router.push("/dashboard/service-desk")
        } else {
          router.push("/dashboard")
        }
      } else {
        setError("Authentication failed. Please try again.")
      }
    } catch (err) {
      setError("Connection error. Please try again.")
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
              Secure Access
            </CardTitle>
            <CardDescription className="text-base">Sign in to access your IT management dashboard</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-2">
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  Sign In
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
        </CardContent>
      </Card>
    </div>
  )
}
