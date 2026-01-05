"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, Lock, Mail, ArrowRight, Info } from "lucide-react"
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
  const [showDefaultAccounts, setShowDefaultAccounts] = useState(false)

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
        setIsLoading(false)
        return
      }

      const userData = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email || data.user.username,
        name: data.user.full_name || data.user.username,
        full_name: data.user.full_name,
        role: data.user.role,
        location: data.user.location,
        department: data.user.department,
        phone: data.user.phone,
      }

      localStorage.setItem("qcc_current_user", JSON.stringify(userData))

      login(userData)

      await new Promise((resolve) => setTimeout(resolve, 400))

      let redirectUrl = "/dashboard"
      if (userData.role === "admin") {
        redirectUrl = "/dashboard/admin"
      } else if (userData.role === "it_store_head") {
        redirectUrl = "/dashboard/store-inventory"
      } else if (userData.role === "it_staff") {
        redirectUrl = "/dashboard/assigned-tasks"
      } else if (userData.role === "staff") {
        redirectUrl = "/dashboard/service-desk"
      }

      window.location.href = redirectUrl
    } catch (err) {
      console.error("Login error:", err)
      setError("Connection error. Please try again.")
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const quickLogin = (username: string, password: string) => {
    setFormData({ username, password })
    setShowDefaultAccounts(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3 lg:hidden">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-xl">
            <Shield className="h-10 w-10 text-slate-900" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">QCC IT Tracker</h1>
          <p className="text-sm text-muted-foreground">Ghana Community Network Services</p>
        </div>
      </div>

      <Card className="w-full border shadow-lg">
        <CardHeader className="space-y-4 pb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-xl">
            <Shield className="h-7 w-7 text-slate-900" />
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-base">Sign in to access the IT management system</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="border-2">
              <AlertDescription className="font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 dark:text-blue-200">Default accounts available for testing</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDefaultAccounts(!showDefaultAccounts)}
                  className="text-blue-600 hover:text-blue-700 h-auto p-1"
                >
                  {showDefaultAccounts ? "Hide" : "Show"}
                </Button>
              </div>
              {showDefaultAccounts && (
                <div className="mt-3 space-y-2 text-blue-700 dark:text-blue-300">
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-blue-900 rounded">
                    <div className="text-xs">
                      <div className="font-semibold">Admin Account</div>
                      <div>ohemengappiah@qccgh.com / ghana</div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => quickLogin("ohemengappiah@qccgh.com", "ghana")}
                      className="text-xs h-7"
                    >
                      Use
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-blue-900 rounded">
                    <div className="text-xs">
                      <div className="font-semibold">Store Manager</div>
                      <div>storemanager@qccgh.com / store123</div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => quickLogin("storemanager@qccgh.com", "store123")}
                      className="text-xs h-7"
                    >
                      Use
                    </Button>
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="email"
                  placeholder="your.email@qccgh.com"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  className="pl-11 h-12 text-base"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-11 h-12 text-base"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-600 hover:via-amber-600 hover:to-yellow-700 shadow-lg text-slate-900"
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

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Need an account?{" "}
                <a href="/create-account" className="font-semibold text-primary hover:underline">
                  Request Access
                </a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">Account Information:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Admins have full system access and manage all users</li>
              <li>Store managers control IT inventory and requisitions</li>
              <li>Staff members need admin approval after registration</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
