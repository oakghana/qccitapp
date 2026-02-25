"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, RotateCcw, Calendar, User, FileText, Trash2 } from "lucide-react"
import { format } from "date-fns"

interface DeletionRecord {
  id: string
  document_id: string
  user_name: string
  user_id: string
  timestamp: string
  details?: {
    title?: string
    document_type?: string
    file_name?: string
    uploaded_by?: string
    uploaded_by_name?: string
  }
}

export function DeletionHistoryAdmin() {
  const [deletions, setDeletions] = useState<DeletionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDeletionHistory()
  }, [])

  const fetchDeletionHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/pdf-uploads/history?action=document_deleted&limit=100")
      const data = await response.json()

      if (!data.success) {
        setError(data.error || "Failed to fetch deletion history")
        return
      }

      setDeletions(data.logs || [])
    } catch (err) {
      console.error("[v0] Error fetching deletion history:", err)
      setError("Failed to fetch deletion history")
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (documentId: string, userName: string) => {
    try {
      setRestoring(documentId)
      
      // Get current user info from session/auth
      const response = await fetch("/api/pdf-uploads/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          userId: "admin", // This should come from actual auth session
          userName: userName,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || "Failed to restore document")
        return
      }

      // Refresh the list
      await fetchDeletionHistory()
      setError(null)
    } catch (err) {
      console.error("[v0] Error restoring document:", err)
      setError("Failed to restore document")
    } finally {
      setRestoring(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading deletion history...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Document Deletion History
          </CardTitle>
          <CardDescription>
            Track and audit all deleted documents. Administrators can restore deleted documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {deletions.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground">No deleted documents found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletions.map((deletion) => (
                <div
                  key={deletion.id}
                  className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">
                          {deletion.details?.title || "Untitled Document"}
                        </h3>
                        {deletion.details?.document_type && (
                          <Badge variant="outline" className="text-xs">
                            {deletion.details.document_type}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Deleted by: <span className="font-medium text-foreground">{deletion.user_name}</span></span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(deletion.timestamp), "PPp")}</span>
                        </div>

                        {deletion.details?.uploaded_by_name && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>Uploaded by: <span className="font-medium text-foreground">{deletion.details.uploaded_by_name}</span></span>
                          </div>
                        )}

                        {deletion.details?.file_name && (
                          <div className="text-muted-foreground">
                            <span className="text-xs">File: {deletion.details.file_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(deletion.document_id, deletion.user_name)}
                      disabled={restoring === deletion.document_id}
                      className="flex items-center gap-2 whitespace-nowrap"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {restoring === deletion.document_id ? "Restoring..." : "Restore"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {deletions.length > 0 && (
            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
              <p>Total deleted documents shown: {deletions.length}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
