"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, User, Lock, Users, UserCheck, Crown } from "lucide-react"

interface LoginFormData {
  username: string
  password: string
  otp: string
}

const demoCredentials = [
  {
    type: "Admin (Head Office)",
    username: "admin.headoffice",
    password: "admin123",
    icon: Crown,
    description: "Full system access - all locations",
  },
  {
    type: "Admin (Kumasi)",
    username: "admin.kumasi",
    password: "admin123",
    icon: Crown,
    description: "Kumasi location admin access only",
  },
  {
    type: "IT Head (Head Office)",
    username: "ithead.headoffice",
    password: "ithead123",
    icon: UserCheck,
    description: "Head office IT management & approvals",
  },
  {
    type: "IT Head (Kumasi)",
    username: "ithead.kumasi",
    password: "ithead123",
    icon: UserCheck,
    description: "Kumasi IT management & approvals",
  },
  {
    type: "Service Desk Head (Head Office)",
    username: "deskhead.headoffice",
    password: "desk123",
    icon: Users,
    description: "Head office service desk management",
  },
  {
    type: "Service Desk Head (Kumasi)",
    username: "deskhead.kumasi",
    password: "desk123",
    icon: Users,
    description: "Kumasi service desk management",
  },
  {
    type: "Service Desk Staff (Head Office)",
    username: "desk.headoffice",
    password: "staff123",
    icon: User,
    description: "Head office service desk support",
  },
  {
    type: "Service Desk Staff (Kumasi)",
    username: "desk.kumasi",
    password: "staff123",
    icon: User,
    description: "Kumasi service desk support",
  },
  {
    type: "IT Staff (Head Office)",
    username: "staff.headoffice",
    password: "staff123",
    icon: Users,
    description: "Head office device tracking & repairs",
  },
  {
    type: "IT Staff (Kumasi)",
    username: "staff.kumasi",
    password: "staff123",
    icon: Users,
    description: "Kumasi device tracking & repairs",
  },
  {
    type: "Natland Computers",
    username: "natland.provider",
    password: "natland123",
    icon: User,
    description: "Natland Computers service provider",
  },
  {
    type: "Staff (Head Office)",
    username: "user.headoffice",
    password: "user123",
    icon: User,
    description: "Regular staff - submit IT complaints",
  },
  {
    type: "Staff (Kumasi)",
    username: "user.kumasi",
    password: "user123",
    icon: User,
    description: "Regular staff - submit IT complaints",
  },
  {
    type: "Staff (Accra)",
    username: "user.accra",
    password: "user123",
    icon: User,
    description: "Regular staff - submit IT complaints",
  },
  {
    type: "Staff (Kaase)",
    username: "user.kaase",
    password: "user123",
    icon: User,
    description: "Regular staff - submit IT complaints",
  },
  {
    type: "Staff (Cape Coast)",
    username: "user.capecoast",
    password: "user123",
    icon: User,
    description: "Regular staff - submit IT complaints",
  },
]

export function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    username: "",
    password: "",
    otp: "",
  })
  const [step, setStep] = useState<"credentials" | "otp">("credentials")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const fillDemoCredentials = (username: string, password: string) => {
    setFormData((prev) => ({ ...prev, username, password }))
    setError("")
  }

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Simulate API call for credentials validation
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock validation - in real app, this would call your auth API
      if (formData.username && formData.password) {
        setStep("otp")
      } else {
        setError("Please enter valid credentials")
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
      // Simulate OTP verification
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock OTP validation
      if (formData.otp.length === 6) {
        const { login } = await import("@/lib/auth-context")
        // Set user context based on username
        if (typeof window !== "undefined") {
          const authModule = await import("@/lib/auth-context")
          // Store login info for context pickup
          localStorage.setItem("pendingLogin", formData.username)
        }
        // Redirect to dashboard - in real app, set auth tokens
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
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <img
            src="/images/qcc-logo.png"
            alt="Quality Control Company Limited Logo"
            className="h-20 w-20 object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">QCC IT APP</h1>
          <p className="text-sm text-muted-foreground mt-1">Powered by the IT Department</p>
        </div>
      </div>

      {step === "credentials" && (
        <Card className="w-full border-dashed border-2 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-foreground">Demo Access</CardTitle>
            <CardDescription className="text-foreground/80">
              Click any credential below to auto-fill and test different user roles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoCredentials.map((cred) => {
              const IconComponent = cred.icon
              return (
                <Button
                  key={cred.type}
                  variant="outline"
                  className="w-full justify-start h-auto p-3 bg-background hover:bg-primary/10"
                  onClick={() => fillDemoCredentials(cred.username, cred.password)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <IconComponent className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium">{cred.type}</div>
                      <div className="text-xs text-muted-foreground">{cred.description}</div>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{cred.username}</div>
                  </div>
                </Button>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{step === "credentials" ? "Sign In" : "Verify OTP"}</CardTitle>
          <CardDescription>
            {step === "credentials"
              ? "Enter your credentials to access the IT tracking system"
              : "Enter the 6-digit code sent to your registered device"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Continue to OTP"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={formData.otp}
                  onChange={(e) => handleInputChange("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <div className="text-center p-2 bg-primary/5 rounded-md border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  Demo OTP: <span className="font-mono font-medium text-primary">123456</span>
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setStep("credentials")}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </div>

              <div className="text-center">
                <Button variant="link" className="text-sm text-muted-foreground">
                  Resend OTP
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
