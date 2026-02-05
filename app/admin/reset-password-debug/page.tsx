"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResetPasswordDebugPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const resetPassword = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/force-reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "joseph.asante@qccgh.com",
          newPassword: "qcc@123",
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Force Password Reset - Debug Tool</CardTitle>
          <CardDescription>
            Reset Joseph Asante's password to qcc@123
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={resetPassword} disabled={loading} className="w-full">
            {loading ? "Resetting Password..." : "Reset Password for joseph.asante@qccgh.com"}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {result?.success && (
            <div className="p-4 bg-green-100 border border-green-400 rounded text-green-800">
              <h3 className="font-semibold mb-2">Password Reset Successful!</h3>
              <p>Email: joseph.asante@qccgh.com</p>
              <p>Password: qcc@123</p>
              <p className="mt-2 text-sm">You can now try logging in with these credentials.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
