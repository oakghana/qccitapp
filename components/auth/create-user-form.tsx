"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { User, Mail, MapPin, Shield, Clock, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getRoleColorScheme } from "@/lib/role-colors"
import { cn } from "@/lib/utils"
import { LOCATIONS, type LocationKey } from "@/lib/locations"
import { useToast } from "@/hooks/use-toast"

export interface PendingUser {
  id: string
  name: string
  email: string
  phone: string
  location: LocationKey
  department: string
  supervisor: string
  jobTitle: string
  reason: string
  requestedBy: string
  requestedDate: string
  status: "pending" | "approved" | "rejected"
  notes?: string
  temporaryPassword?: string
}

interface CreateUserFormProps {
  onUserCreated: (user: PendingUser) => void
  onClose?: () => void
}

export function CreateUserForm({ onUserCreated, onClose }: CreateUserFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const roleColors = user?.role ? getRoleColorScheme(user.role) : null
  const isPublicAccess = !user
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: (user?.location || "head_office") as LocationKey,
    department: "",
    supervisor: "",
    jobTitle: "",
    reason: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      console.log("[v0] Submitting registration to API...", formData)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.email, // Use email as username
          email: formData.email,
          fullName: formData.name,
          phone: formData.phone,
          password: `temp${Math.random().toString(36).slice(-8)}`, // Generate temporary password
          department: formData.department,
          location: formData.location,
        }),
      })

      const result = await response.json()
      console.log("[v0] Registration response:", result)

      if (!response.ok) {
        throw new Error(result.message || "Registration failed")
      }

      const newPendingUser: PendingUser = {
        id: result.userId || `PND-${String(Date.now()).slice(-6)}`,
        ...formData,
        requestedBy: user?.name || "Self-Registration",
        requestedDate: new Date().toISOString(),
        status: "pending",
        temporaryPassword: "Set by admin upon approval",
      }

      console.log("[v0] User successfully registered and saved to database:", newPendingUser)
      onUserCreated(newPendingUser)
      setSubmitted(true)
      setIsSubmitting(false)

      // Auto close after success
      setTimeout(() => {
        if (onClose) onClose()
      }, 3000)
    } catch (error) {
      console.error("[v0] Registration error:", error)
      toast({
        title: "❌ Registration Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (submitted) {
    return (
      <Card
        className={cn(
          "max-w-2xl mx-auto",
          roleColors
            ? `${roleColors.background}`
            : "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950",
        )}
      >
        <CardContent className="p-8 text-center">
          <div
            className={cn(
              "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4",
              roleColors ? `${roleColors.background}` : "bg-green-100 dark:bg-green-800",
            )}
          >
            <CheckCircle
              className={cn("h-8 w-8", roleColors ? roleColors.textPrimary : "text-green-600 dark:text-green-400")}
            />
          </div>
          <h3
            className={cn(
              "text-xl font-semibold mb-2",
              roleColors ? roleColors.textPrimary : "text-green-900 dark:text-green-100",
            )}
          >
            User Account Request Submitted
          </h3>
          <p
            className={cn("text-sm mb-4", roleColors ? roleColors.textSecondary : "text-green-700 dark:text-green-300")}
          >
            The user account request for <strong>{formData.name}</strong> has been submitted successfully. An
            administrator will review and approve the account within 24-48 hours.
          </p>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
            <Clock className="mr-1 h-3 w-3" />
            Pending Admin Approval
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader
        className={cn(
          "text-center",
          roleColors
            ? `${roleColors.background}`
            : "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950",
        )}
      >
        <div
          className={cn(
            "w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4",
            roleColors ? `${roleColors.background}` : "bg-orange-100 dark:bg-orange-800",
          )}
        >
          <User
            className={cn("h-8 w-8", roleColors ? roleColors.textPrimary : "text-orange-600 dark:text-orange-400")}
          />
        </div>
        <CardTitle
          className={cn("text-2xl", roleColors ? roleColors.textPrimary : "text-orange-900 dark:text-orange-100")}
        >
          Create New User Account
        </CardTitle>
        <CardDescription className={cn(roleColors ? roleColors.textSecondary : "text-orange-700 dark:text-orange-300")}>
          Submit a request to create a new user account. All requests require administrator approval.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <Shield className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Important:</strong> This form creates a user account request that requires administrator approval.
            The user will not be able to access the system until an admin activates their account and assigns
            appropriate roles.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User className="mr-2 h-5 w-5" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="user@qcc.com.gh"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+233 XX XXX XXXX"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOCATIONS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4" />
                          {label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Job Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                  placeholder="e.g., Administrative Assistant, IT Support"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ITD">ITD</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="AUDIT">AUDIT</SelectItem>
                    <SelectItem value="ACCOUNTS">ACCOUNTS</SelectItem>
                    <SelectItem value="RESEARCH">RESEARCH</SelectItem>
                    <SelectItem value="ESTATE">ESTATE</SelectItem>
                    <SelectItem value="SECURITY">SECURITY</SelectItem>
                    <SelectItem value="OPERATIONS">OPERATIONS</SelectItem>
                    <SelectItem value="PROCUREMENT">PROCUREMENT</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="supervisor">Direct Supervisor/Manager *</Label>
                <Input
                  id="supervisor"
                  value={formData.supervisor}
                  onChange={(e) => handleInputChange("supervisor", e.target.value)}
                  placeholder="Name of direct supervisor or manager"
                  required
                />
              </div>
            </div>
          </div>

          {/* Request Justification */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Request Justification
            </h3>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Account Request *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange("reason", e.target.value)}
                placeholder="Please provide a detailed explanation of why this user needs access to the IT tracking system..."
                className="min-h-[120px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                Include information about job responsibilities, required system access, and business justification.
              </p>
            </div>
          </div>

          {/* Request Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Request Summary</h4>
            <div className="text-sm space-y-1">
              <p>
                <strong>Requested by:</strong> {user?.name || "Self-Registration"} {user?.role && `(${user.role})`}
              </p>
              <p>
                <strong>Request Date:</strong> {new Date().toLocaleDateString()}
              </p>
              <p>
                <strong>Location:</strong> {LOCATIONS[formData.location]}
              </p>
              <p>
                <strong>Status:</strong> <Badge variant="secondary">Pending Approval</Badge>
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-1 text-white",
                roleColors
                  ? `bg-gradient-to-r ${roleColors.gradient} ${roleColors.hoverGradient}`
                  : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600",
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Submit User Request
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
