"use client"

import React from "react"
import { CreateUserForm } from "@/components/auth/create-user-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, UserPlus } from "lucide-react"

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
          <h1 className="text-3xl font-bold text-orange-900 dark:text-orange-100 mb-2">
            QCC IT System
          </h1>
          <p className="text-orange-700 dark:text-orange-300">
            Request Access to the IT Tracking System
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => window.location.href = "/"}
            className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-600 dark:text-orange-300 dark:hover:bg-orange-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </div>

        {/* Information Card */}
        <Card className="max-w-4xl mx-auto mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-xl text-blue-900 dark:text-blue-100">
              Account Request Information
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Please read the following information before submitting your account request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Who Can Request Access?</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• QCC staff members</li>
                  <li>• Contract employees</li>
                  <li>• Authorized service providers</li>
                  <li>• IT department personnel</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Approval Process</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Submit detailed request form</li>
                  <li>• Administrator reviews request</li>
                  <li>• Approval within 24-48 hours</li>
                  <li>• Email notification when approved</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Required Information</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Full name and contact details</li>
                  <li>• Job title and department</li>
                  <li>• Supervisor information</li>
                  <li>• Business justification</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What Happens Next?</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Request submitted to admin</li>
                  <li>• Role assignment by admin</li>
                  <li>• Temporary credentials provided</li>
                  <li>• Access to appropriate modules</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Create Account Form */}
        <CreateUserForm onUserCreated={handleUserCreated} />

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-orange-600 dark:text-orange-400">
          <p>For technical support, contact IT Department: it-support@qcc.com.gh</p>
        </div>
      </div>
    </div>
  )
}