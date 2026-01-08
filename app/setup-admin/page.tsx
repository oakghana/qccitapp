"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const setupAdmin = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/setup-admin", {
        method: "GET",
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Setup failed")
      }
    } catch (err: any) {
      setError(err.message || "Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-2xl bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Admin Account Setup</CardTitle>
          <CardDescription className="text-slate-400">
            Initialize the admin account for the IT Device Tracker application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white mb-2">Default Admin Credentials</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <p>
                <span className="font-medium">Username:</span> ohemengappiah@qccgh.com
              </p>
              <p>
                <span className="font-medium">Password:</span> ghana@1
              </p>
              <p>
                <span className="font-medium">Role:</span> Admin
              </p>
            </div>
          </div>

          <Button onClick={setupAdmin} disabled={loading} className="w-full" size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up admin account...
              </>
            ) : (
              "Setup Admin Account"
            )}
          </Button>

          {result && (
            <div className="bg-green-950/30 border border-green-800 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-semibold text-green-400">{result.message}</p>
                  <div className="text-sm text-green-300 space-y-1">
                    <p>Username: {result.username}</p>
                    <p>Password: {result.password}</p>
                    <p>Role: {result.role}</p>
                    <p>Status: {result.status}</p>
                    <p>Password Verified: {result.passwordVerified ? "✓ Yes" : "✗ No"}</p>
                  </div>
                  <div className="pt-2">
                    <Button asChild variant="outline" className="bg-green-900/30 hover:bg-green-900/50 text-green-300">
                      <a href="/">Go to Login</a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-950/30 border border-red-800 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-red-400">Setup Failed</p>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-950/30 border border-blue-800 p-4 rounded-lg text-sm text-blue-300">
            <p className="font-semibold mb-2">What this does:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Deletes existing admin account if it exists</li>
              <li>Creates a fresh admin account with bcryptjs password hashing</li>
              <li>Sets up proper authentication for the application</li>
              <li>Verifies the password works correctly</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
