"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, FileText } from "lucide-react"
import { FormNavigation } from "@/components/ui/form-navigation"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { canSeeAllLocations, canCreateRepairs } from "@/lib/location-filter"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"

interface RepairRequest {
  deviceId: string
  deviceName: string
  requestedBy: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  attachments: string[]
  signedRequestForm: string // Required signed and endorsed form
  location: "head_office" | "kumasi" | "accra" | "kaase_inland_port" | "cape_coast"
}

interface NewRepairRequestFormProps {
  onSubmit: (
    request: Omit<RepairRequest, "id" | "requestedBy" | "requestedDate" | "status" | "location" | "locationName"> & {
      attachmentUrls?: string[]
    },
  ) => void
}

const mockDevices = [
  { id: "DL-2024-001", name: "Dell Latitude 5520", location: "accra" as const },
  { id: "HP-2024-045", name: "HP LaserJet Pro", location: "head_office" as const },
  { id: "LD-2024-012", name: "Lenovo ThinkCentre", location: "kumasi" as const },
  { id: "IP-2024-008", name: "iPhone 13", location: "kaase_inland_port" as const },
]

export function NewRepairRequestForm({ onSubmit }: NewRepairRequestFormProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [devices, setDevices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    deviceId: "",
    deviceName: "",
    description: "",
    priority: "medium" as const,
    attachments: [] as string[],
  })

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [signedRequestForm, setSignedRequestForm] = useState<File | null>(null)

  const canCreate = user && canCreateRepairs(user)

  useEffect(() => {
    loadDevices()
  }, [user])

  const loadDevices = async () => {
    if (!user) return

    setLoading(true)
    try {
      let query = supabase.from("devices").select("*")

      if (!canSeeAllLocations(user) && user.location) {
        query = query.ilike("location", user.location)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error loading devices:", error)
        return
      }

      setDevices(data || [])
    } catch (error) {
      console.error("[v0] Error loading devices:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate that signed request form is attached
    if (!signedRequestForm) {
      alert("Please attach the signed and endorsed request form before submitting.")
      return
    }

    setLoading(true)

    try {
      // Upload the signed request form to Supabase storage
      const signedFormFileName = `signed_request_form_${Date.now()}_${signedRequestForm.name.replace(/\s+/g, "_")}`
      const signedFormBuffer = await signedRequestForm.arrayBuffer()

      const { data: signedFormUploadData, error: signedFormUploadError } = await supabase.storage
        .from("pdf-documents")
        .upload(signedFormFileName, signedFormBuffer, {
          contentType: signedRequestForm.type,
          cacheControl: "3600",
        })

      if (signedFormUploadError) {
        console.error("[v0] Error uploading signed request form:", signedFormUploadError)
        alert("Failed to upload signed request form. Please try again.")
        return
      }

      // Get public URL for signed form
      const { data: signedFormUrlData } = supabase.storage
        .from("pdf-documents")
        .getPublicUrl(signedFormFileName)

      // Upload additional attachments if any
      const attachmentUrls: string[] = []
      for (const file of selectedFiles) {
        const fileName = `attachment_${Date.now()}_${file.name.replace(/\s+/g, "_")}`
        const fileBuffer = await file.arrayBuffer()

        const { error: uploadError } = await supabase.storage
          .from("pdf-documents")
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            cacheControl: "3600",
          })

        if (uploadError) {
          console.error("[v0] Error uploading attachment:", uploadError)
          continue // Skip failed uploads but continue with others
        }

        const { data: urlData } = supabase.storage
          .from("pdf-documents")
          .getPublicUrl(fileName)

        attachmentUrls.push(urlData.publicUrl)
      }

      const attachmentNames = selectedFiles.map((file) => file.name)
      onSubmit({
        ...formData,
        attachments: attachmentNames,
        signedRequestForm: signedFormUrlData.publicUrl,
        attachmentUrls: attachmentUrls,
      })
    } catch (error) {
      console.error("[v0] Error in form submission:", error)
      alert("An error occurred while submitting the form. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDeviceSelect = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId)
    if (device) {
      setFormData((prev) => ({
        ...prev,
        deviceId: device.id,
        deviceName: device.name || `${device.type} - ${device.model}`,
      }))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles((prev) => [...prev, ...files])
  }

  const handleSignedRequestFormUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        alert("Please upload a PDF or image file for the signed request form.")
        return
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB.")
        return
      }
      setSignedRequestForm(file)
    }
  }

  const removeSignedRequestForm = () => {
    setSignedRequestForm(null)
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      <FormNavigation currentPage="/dashboard/repairs" />

      {!canCreate && (
        <Alert variant="destructive" className="mb-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Only IT staff and Admin at Head Office can create repair requests. Other users can view existing repairs.
            For IT support, please submit a service desk ticket.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="device">Select Device</Label>
            <Select value={formData.deviceId} onValueChange={handleDeviceSelect} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading devices..." : "Choose a device"} />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    {device.name || `${device.type} - ${device.model}`} ({device.asset_tag || device.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Problem Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Describe the issue with the device in detail..."
            rows={4}
            required
          />
        </div>

        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="text-lg text-red-800 dark:text-red-200">Required: Signed Request Form</CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300">
              Upload the repair request form signed by you and endorsed by your Head and Regional Head.
              This is mandatory before the repair request can be submitted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-red-300 dark:border-red-700 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-red-500 mb-2" />
              <div className="space-y-2">
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">Upload Signed & Endorsed Form *</p>
                <p className="text-xs text-red-600 dark:text-red-400">PDF or image files only, max 10MB</p>
              </div>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleSignedRequestFormUpload}
                className="mt-2 border-red-300 focus:border-red-500"
                required
              />
            </div>

            {signedRequestForm && (
              <div className="space-y-2">
                <Label className="text-red-800 dark:text-red-200">Attached Signed Form:</Label>
                <div className="flex items-center justify-between p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-800 dark:text-red-200">{signedRequestForm.name}</span>
                    <span className="text-xs text-red-600 dark:text-red-400">
                      ({(signedRequestForm.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeSignedRequestForm}
                    className="h-6 w-6 text-red-600 hover:text-red-800 hover:bg-red-200 dark:text-red-400 dark:hover:text-red-200 dark:hover:bg-red-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attachments</CardTitle>
            <CardDescription>Upload repair forms, photos, or diagnostic reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Click to upload files or drag and drop</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB each</p>
              </div>
              <Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="mt-2" />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files:</Label>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="submit"
            disabled={!formData.deviceId || !formData.description || !signedRequestForm || !canCreate || loading}
          >
            {loading ? "Submitting..." : "Submit Repair Request"}
          </Button>
        </div>
      </form>
    </div>
  )
}
