"use client"
import { CreateUserForm } from "@/components/auth/create-user-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PublicCreateAccountPage() {
  const handleUserCreated = (user: any) => {
    // Show success and redirect to login
    setTimeout(() => {
      window.location.href = "/"
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950 dark:via-amber-950 dark:to-yellow-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/images/qcc-logo.png"
              alt="Quality Control Company Limited Logo"
              className="h-20 w-20 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-2">Request Access</h1>
          <p className="text-orange-700 dark:text-orange-300">Submit your details for account approval</p>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </div>

        {/* Create Account Form */}
        <CreateUserForm onUserCreated={handleUserCreated} />

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-orange-600 dark:text-orange-400">
          <p>Need help? Contact IT Department: it-support@qcc.com.gh</p>
        </div>
      </div>
    </div>
  )
}
