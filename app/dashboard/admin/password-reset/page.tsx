"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function PasswordResetPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleResetPasswords = async () => {
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch("/api/admin/reset-passwords-now", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Failed to reset passwords")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Reset All User Passwords</CardTitle>
          <CardDescription>
            This will reset all approved users' passwords to <strong>qcc@123</strong> using proper bcryptjs hashing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>Warning:</strong> This action will reset passwords for all approved users. They will need to use
              <code className="mx-1 px-2 py-1 bg-amber-100 rounded">qcc@123</code> to login.
            </p>
          </div>

          <Button onClick={handleResetPasswords} disabled={loading} size="lg" className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Resetting Passwords..." : "Reset All Passwords"}
          </Button>

          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <div className="space-y-2">
                  <p className="font-semibold">{result.message}</p>
                  {result.users && result.users.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Updated users:</p>
                      <ul className="text-sm space-y-1">
                        {result.users.map((username: string) => (
                          <li key={username} className="ml-4">
                            • {username}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.hash && <p className="text-xs font-mono mt-2 text-green-700">Hash preview: {result.hash}</p>}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ol className="text-sm space-y-2 text-muted-foreground list-decimal list-inside">
              <li>Click the button above to reset all user passwords</li>
              <li>
                All approved users will be able to login with password:{" "}
                <code className="px-1 py-0.5 bg-muted rounded">qcc@123</code>
              </li>
              <li>Test login with any approved user account</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
