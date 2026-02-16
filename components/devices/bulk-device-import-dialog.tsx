"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertCircle, CheckCircle2, Download, Upload, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"

interface BulkDeviceImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess: () => void
}

interface ValidationError {
  row: number
  field: string
  message: string
  value?: string
}

export function BulkDeviceImportDialog({
  open,
  onOpenChange,
  onImportSuccess,
}: BulkDeviceImportDialogProps) {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [importResult, setImportResult] = useState<{
    success: boolean
    importedCount: number
    totalRows: number
    message: string
  } | null>(null)
  const [step, setStep] = useState<"upload" | "validating" | "results">("upload")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
      setValidationErrors([])
      setImportResult(null)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file && file.name.endsWith(".csv")) {
      setSelectedFile(file)
      setValidationErrors([])
      setImportResult(null)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/devices/bulk-import?action=template")
      const csv = await response.text()
      const blob = new Blob([csv], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "device-import-template.csv"
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download template",
        variant: "destructive",
      })
    }
  }

  const handleImport = async () => {
    if (!selectedFile || !user?.location) {
      toast({
        title: "Error",
        description: "File and location are required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setStep("validating")

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("userLocation", user.location)
      formData.append("userRole", user.role || "")

      const response = await fetch("/api/devices/bulk-import", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setStep("results")
        setImportResult({
          success: true,
          importedCount: result.importedCount,
          totalRows: result.totalRows,
          message: result.message,
        })
        toast({
          title: "Success",
          description: `Successfully imported ${result.importedCount} device(s)`,
        })
        setTimeout(() => {
          onImportSuccess()
          handleClose()
        }, 1500)
      } else {
        setStep("results")
        setValidationErrors(result.validationErrors || [])
        setImportResult({
          success: false,
          importedCount: 0,
          totalRows: result.totalRows || 0,
          message: result.error || "Validation failed",
        })
        toast({
          title: "Validation Failed",
          description: `${result.validationErrors?.length || 0} validation error(s) found`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      setStep("results")
      toast({
        title: "Error",
        description: error.message || "An error occurred during import",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadErrors = () => {
    if (validationErrors.length === 0) return

    const csv = [
      ["Row", "Field", "Error", "Value"].join(","),
      ...validationErrors.map((e) =>
        [e.row, e.field, `"${e.message}"`, `"${e.value || ""}"`].join(",")
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "import-errors.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    setSelectedFile(null)
    setValidationErrors([])
    setImportResult(null)
    setStep("upload")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Import Devices</DialogTitle>
          <DialogDescription>Import multiple devices at once using a CSV file</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === "upload" && (
            <>
              {/* Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">
                  {selectedFile ? selectedFile.name : "Drag and drop your CSV file here"}
                </p>
                <p className="text-xs text-gray-500 mt-1">or click to select a file</p>
              </div>

              {/* File Info */}
              {selectedFile && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">File selected</p>
                    <p className="text-xs text-blue-700 mt-1">{selectedFile.name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">CSV File Format</p>
                <p className="text-xs text-gray-600 mb-3">Your CSV must include these columns:</p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                  <li>
                    <strong>device_type</strong>: laptop, desktop, printer, photocopier, handset, ups,
                    stabiliser, mobile, server, other
                  </li>
                  <li>
                    <strong>brand</strong>: Device brand/manufacturer
                  </li>
                  <li>
                    <strong>model</strong>: Device model number
                  </li>
                  <li>
                    <strong>serial_number</strong>: Unique serial number (must not exist)
                  </li>
                  <li>
                    <strong>status</strong>: active, repair, maintenance, retired (optional, defaults to active)
                  </li>
                  <li>
                    <strong>toner_type</strong>: Required only for printers/photocopiers
                  </li>
                  <li>Other fields (purchase_date, warranty_expiry, etc.) are optional</li>
                </ul>
                <Button
                  onClick={handleDownloadTemplate}
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download Template
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || loading}
                  className="gap-2"
                >
                  {loading ? "Importing..." : "Import Devices"}
                </Button>
              </div>
            </>
          )}

          {step === "validating" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 mb-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-gray-900">Validating your file...</p>
              <p className="text-xs text-gray-500 mt-1">Checking for errors and duplicates</p>
            </div>
          )}

          {step === "results" && importResult && (
            <>
              {importResult.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">{importResult.message}</p>
                      <p className="text-sm text-green-700 mt-1">
                        {importResult.importedCount} device(s) imported successfully
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900">Validation Failed</p>
                        <p className="text-sm text-red-700 mt-1">{importResult.message}</p>
                      </div>
                    </div>
                  </div>

                  {/* Error Details */}
                  {validationErrors.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Errors ({validationErrors.length})
                      </p>
                      <div className="max-h-64 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="divide-y text-xs">
                          {validationErrors.slice(0, 20).map((error, idx) => (
                            <div key={idx} className="p-2 hover:bg-gray-100">
                              <p className="font-mono text-gray-700">
                                Row {error.row}, Column: {error.field}
                              </p>
                              <p className="text-red-600 mt-0.5">{error.message}</p>
                              {error.value && <p className="text-gray-500 mt-0.5">Value: {error.value}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                      {validationErrors.length > 20 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Showing first 20 of {validationErrors.length} errors
                        </p>
                      )}
                      <Button
                        onClick={handleDownloadErrors}
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download Error Report
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Close Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={
                    importResult.success
                      ? handleClose
                      : () => {
                          setStep("upload")
                          setSelectedFile(null)
                          setValidationErrors([])
                        }
                  }
                >
                  {importResult.success ? "Close" : "Try Again"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
