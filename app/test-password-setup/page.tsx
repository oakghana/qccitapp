"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function TestPasswordSetup() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const setPassword = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/set-password-for-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "ohemengappiah@qccgh.com",
          password: "ghana@1",
        }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Password Setup Tool</h1>

        <div className="space-y-4">
          <Button onClick={setPassword} disabled={loading} className="w-full">
            {loading ? "Setting Password..." : "Set Password to ghana@1"}
          </Button>

          {result && (
            <div className="p-4 bg-muted rounded-lg">
              <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          {result?.success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="font-semibold text-green-800 dark:text-green-200">Password Set Successfully!</p>
              <p className="mt-2 text-sm">
                Username: ohemengappiah@qccgh.com
                <br />
                Password: {result.password}
                <br />
                Verification: {result.verificationWorks ? "✓ Working" : "✗ Failed"}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
