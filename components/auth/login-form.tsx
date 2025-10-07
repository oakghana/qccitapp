"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Shield, User, Lock, Users, UserCheck, Crown, UserPlus } from "lucide-react"

interface LoginFormData {
  username: string
  password: string
  otp: string
}

const demoCredentials = [
  {
    type: "Admin (Head Office)",
    username: "admin",
    password: "admin123",
    icon: Crown,
    description: "Full system access - all locations",
  },
  {
    type: "Regional IT Head (Kumasi)",
    username: "regionalhead.kumasi",
    password: "regional123",
    icon: UserCheck,
    description: "Kumasi regional IT management",
  },
  {
    type: "Regional IT Head (Accra)",
    username: "regionalhead.accra",
    password: "regional123",
    icon: UserCheck,
    description: "Accra regional IT management",
  },
  {
    type: "Regional IT Head (Kaase)",
    username: "regionalhead.kaase",
    password: "regional123",
    icon: UserCheck,
    description: "Kaase regional IT management",
  },
  {
    type: "Regional IT Head (Cape Coast)",
    username: "regionalhead.capecoast",
    password: "regional123",
    icon: UserCheck,
    description: "Cape Coast regional IT management",
  },
  {
    type: "IT Head (Head Office)",
    username: "ithead",
    password: "ithead123",
    icon: Users,
    description: "Head office IT operations management",
  },
  {
    type: "IT Service Provider",
    username: "serviceprovider",
    password: "provider123",
    icon: UserPlus,
    description: "External service provider - repair management",
  },
  {
    type: "IT Staff (Head Office)",
    username: "itstaff.headoffice",
    password: "itstaff123",
    icon: User,
    description: "Head office IT support & repairs",
  },
  {
    type: "IT Staff (Kumasi)",
    username: "itstaff.kumasi",
    password: "itstaff123",
    icon: User,
    description: "Kumasi IT support & repairs",
  },
  {
    type: "IT Staff (Accra)",
    username: "itstaff.accra",
    password: "itstaff123",
    icon: User,
    description: "Accra IT support & repairs",
  },
  {
    type: "Staff (Head Office)",
    username: "staff.headoffice",
    password: "staff123",
    icon: User,
    description: "Regular staff - submit requests",
  },
  {
    type: "Staff (Kumasi)",
    username: "staff.kumasi",
    password: "staff123",
    icon: User,
    description: "Regular staff - submit requests",
  },
  {
    type: "Staff (Accra)",
    username: "staff.accra",
    password: "staff123",
    icon: User,
    description: "Regular staff - submit requests",
  },
  {
    type: "Staff (Kaase Inland Port)",
    username: "staff.kaase",
    password: "staff123",
    icon: User,
    description: "Regular staff - submit requests",
  },
  {
    type: "Staff (Cape Coast)",
    username: "staff.capecoast",
    password: "staff123",
    icon: User,
    description: "Regular staff - submit requests",
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
  const [selectedCredential, setSelectedCredential] = useState("")
  const [showCreateAccount, setShowCreateAccount] = useState(false)

  const fillDemoCredentials = (credentialKey: string) => {
    const credential = demoCredentials.find((cred) => `${cred.username}:${cred.password}` === credentialKey)
    if (credential) {
      setFormData((prev) => ({ ...prev, username: credential.username, password: credential.password }))
      setError("")
    }
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
        // Set user context based on username
        if (typeof window !== "undefined") {
          // Store login info for context pickup
          localStorage.setItem("pendingLogin", formData.username)
          // Flag to show mobile app download notification
          localStorage.setItem("showMobileAppDownload", "true")
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
              Select a user role to auto-fill credentials for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="credentialSelect">Select User Role</Label>
              <Select
                value={selectedCredential}
                onValueChange={(value) => {
                  setSelectedCredential(value)
                  fillDemoCredentials(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user role to test..." />
                </SelectTrigger>
                <SelectContent>
                  {demoCredentials.map((cred) => {
                    const IconComponent = cred.icon
                    return (
                      <SelectItem key={cred.type} value={`${cred.username}:${cred.password}`}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-primary" />
                          <span>{cred.type}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            {selectedCredential && (
              <div className="p-3 bg-background rounded-lg border">
                <div className="text-sm">
                  <p className="font-medium">
                    Selected: {demoCredentials.find((c) => `${c.username}:${c.password}` === selectedCredential)?.type}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    {demoCredentials.find((c) => `${c.username}:${c.password}` === selectedCredential)?.description}
                  </p>
                </div>
              </div>
            )}
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

      {/* Create Account Section */}
      {step === "credentials" && (
        <Card className="w-full border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  New to QCC IT System?
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Staff members can request new user accounts for system access
                </p>
              </div>
              <Button
                onClick={() => window.location.href = "/create-account"}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-800"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account Request
              </Button>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                All account requests require administrator approval
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
