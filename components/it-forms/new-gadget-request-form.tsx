"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, Laptop } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

export function NewGadgetRequestForm({ onSubmit }: { onSubmit: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { user } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    // Section A - Requesting Staff Information
    staffName: user?.full_name || "",
    departmentName: "",
    complaintsFromUsers: "",
    requestDate: new Date().toISOString().split("T")[0],
    
    // Section B - Previous IT Gadget History
    makeOfGadget: "",
    serialNumber: "",
    yearOfPurchase: "",
    otherComments: "",
    
    // Section C - HOD Authorization
    departmentalHeadName: "",
    departmentalHeadDate: "",
    
    // Section D - IS Manager
    recommended: "",
    confirmedBy: "",
    confirmedDate: "",
  })

  const departments = [
    "Finance",
    "Human Resources", 
    "Operations",
    "IT",
    "Marketing",
    "Sales",
    "Logistics",
    "Procurement",
    "Administration",
    "Other",
  ]

  const gadgetTypes = [
    "Laptop",
    "Desktop Computer",
    "Monitor",
    "Printer",
    "Scanner",
    "Keyboard",
    "Mouse",
    "UPS",
    "External Hard Drive",
    "USB Flash Drive",
    "Webcam",
    "Headset",
    "Network Switch",
    "Router",
    "Projector",
    "Other",
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.complaintsFromUsers.trim()) {
      setError("Please describe the reason for requesting a new gadget")
      return
    }

    if (!formData.departmentName) {
      setError("Please select a department")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/it-forms/new-gadget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to submit gadget request")
        toast({
          title: "Error",
          description: result.error || "Failed to submit gadget request",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Request Submitted",
        description: `Your new gadget request (${result.requestNumber}) has been submitted successfully`,
      })

      // Reset form
      setFormData({
        staffName: user?.full_name || "",
        departmentName: "",
        complaintsFromUsers: "",
        requestDate: new Date().toISOString().split("T")[0],
        makeOfGadget: "",
        serialNumber: "",
        yearOfPurchase: "",
        otherComments: "",
        departmentalHeadName: "",
        departmentalHeadDate: "",
        recommended: "",
        confirmedBy: "",
        confirmedDate: "",
      })

      onSubmit()
    } catch (err) {
      setError("Failed to submit gadget request")
      toast({
        title: "Error",
        description: "Failed to submit gadget request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Generate year options from 2010 to current year
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: currentYear - 2009 }, (_, i) => (currentYear - i).toString())

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md flex items-center gap-2 border border-destructive/20">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Section A - Requesting Staff Information */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-semibold">SECTION A</div>
          <h3 className="font-semibold text-sm">Requesting Staff Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="staffName">Name of Staff Making Request *</Label>
            <Input
              id="staffName"
              name="staffName"
              value={formData.staffName}
              onChange={handleInputChange}
              placeholder="Your name"
              required
              disabled
              className="opacity-70"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="departmentName">Department Name *</Label>
            <Select value={formData.departmentName} onValueChange={(value) => handleSelectChange("departmentName", value)}>
              <SelectTrigger id="departmentName">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="complaintsFromUsers">Reason for Request / Complaints *</Label>
          <Textarea
            id="complaintsFromUsers"
            name="complaintsFromUsers"
            value={formData.complaintsFromUsers}
            onChange={handleInputChange}
            placeholder="Describe why you need a new IT gadget (e.g., current device is beyond repair, need for new role, etc.)..."
            className="min-h-24"
            required
          />
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="requestDate">Date of Request</Label>
          <Input
            id="requestDate"
            name="requestDate"
            type="date"
            value={formData.requestDate}
            onChange={handleInputChange}
            disabled
            className="opacity-70 w-48"
          />
        </div>
      </div>

      {/* Section B - Previous IT Gadget History */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-orange-500/10 text-orange-600 px-2 py-1 rounded text-xs font-semibold">SECTION B</div>
          <h3 className="font-semibold text-sm">Previous IT Gadget History</h3>
          <span className="text-xs text-muted-foreground">(To be filled by IT Hardware Group)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="makeOfGadget">Make of IT Gadget</Label>
            <Select value={formData.makeOfGadget} onValueChange={(value) => handleSelectChange("makeOfGadget", value)}>
              <SelectTrigger id="makeOfGadget">
                <SelectValue placeholder="Select gadget type" />
              </SelectTrigger>
              <SelectContent>
                {gadgetTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serialNumber">Serial Number</Label>
            <Input
              id="serialNumber"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleInputChange}
              placeholder="Enter serial number of current gadget"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="yearOfPurchase">Year of Purchase</Label>
            <Select value={formData.yearOfPurchase} onValueChange={(value) => handleSelectChange("yearOfPurchase", value)}>
              <SelectTrigger id="yearOfPurchase">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="otherComments">Any Other Comments</Label>
          <Textarea
            id="otherComments"
            name="otherComments"
            value={formData.otherComments}
            onChange={handleInputChange}
            placeholder="Additional comments about the previous gadget condition..."
            className="min-h-16"
          />
        </div>
      </div>

      {/* Section C - HOD Authorization */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-500/10 text-blue-600 px-2 py-1 rounded text-xs font-semibold">SECTION C</div>
          <h3 className="font-semibold text-sm">Authorization from Head of Department</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="departmentalHeadName">Name of Departmental Head</Label>
            <Input
              id="departmentalHeadName"
              name="departmentalHeadName"
              value={formData.departmentalHeadName}
              onChange={handleInputChange}
              placeholder="HOD name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="departmentalHeadDate">Date</Label>
            <Input
              id="departmentalHeadDate"
              name="departmentalHeadDate"
              type="date"
              value={formData.departmentalHeadDate}
              onChange={handleInputChange}
            />
          </div>
        </div>
      </div>

      {/* Section D - IS Manager */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-green-500/10 text-green-600 px-2 py-1 rounded text-xs font-semibold">SECTION D</div>
          <h3 className="font-semibold text-sm">IS Manager / Office Use Only</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Recommended?</Label>
            <RadioGroup
              value={formData.recommended}
              onValueChange={(value) => handleSelectChange("recommended", value)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="recommended_yes" />
                <Label htmlFor="recommended_yes" className="font-normal cursor-pointer">
                  Yes
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="recommended_no" />
                <Label htmlFor="recommended_no" className="font-normal cursor-pointer">
                  No
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="confirmedBy">Confirmed By</Label>
              <Input
                id="confirmedBy"
                name="confirmedBy"
                value={formData.confirmedBy}
                onChange={handleInputChange}
                placeholder="IS Manager name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmedDate">Date</Label>
              <Input
                id="confirmedDate"
                name="confirmedDate"
                type="date"
                value={formData.confirmedDate}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading} size="lg" className="gap-2">
          <Laptop className="h-4 w-4" />
          {loading ? "Submitting..." : "Submit New Gadget Request"}
        </Button>
      </div>
    </form>
  )
}
