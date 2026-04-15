"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertCircle, Wrench, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface FaultItem {
  id: string
  partItem: string
  makeSerialNo: string
  faultRemarks: string
}

export function MaintenanceRepairsForm({ onSubmit }: { onSubmit: () => void }) {
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
    
    // Section B - IT Hardware Group (Technician Use)
    faultItems: [{ id: "1", partItem: "", makeSerialNo: "", faultRemarks: "" }] as FaultItem[],
    otherComments: "",
    hardwareSupervisorName: "",
    hardwareSupervisorDate: "",
    
    // Repair History
    dateOfLastRepairs: "",
    dateOfPurchase: "",
    numberOfTimesRepaired: "",
    
    // Section C - HOD Authorization
    sectionalHeadName: "",
    sectionalHeadDate: "",
    
    // Section D - IS Manager
    confirmedBy: "",
    confirmedDate: "",
    
    // Post-repair feedback
    repairStatus: "",
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFaultItemChange = (id: string, field: keyof FaultItem, value: string) => {
    setFormData((prev) => ({
      ...prev,
      faultItems: prev.faultItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }))
  }

  const addFaultItem = () => {
    const newId = (formData.faultItems.length + 1).toString()
    setFormData((prev) => ({
      ...prev,
      faultItems: [...prev.faultItems, { id: newId, partItem: "", makeSerialNo: "", faultRemarks: "" }],
    }))
  }

  const removeFaultItem = (id: string) => {
    if (formData.faultItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        faultItems: prev.faultItems.filter((item) => item.id !== id),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (!formData.complaintsFromUsers.trim()) {
      setError("Please describe the complaint/issue")
      return
    }

    if (!formData.departmentName) {
      setError("Please select a department")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/it-forms/maintenance-repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to submit maintenance request")
        toast({
          title: "Error",
          description: result.error || "Failed to submit maintenance request",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Request Submitted",
        description: `Your maintenance request (${result.requestNumber}) has been submitted successfully`,
      })

      // Reset form
      setFormData({
        staffName: user?.full_name || "",
        departmentName: "",
        complaintsFromUsers: "",
        requestDate: new Date().toISOString().split("T")[0],
        faultItems: [{ id: "1", partItem: "", makeSerialNo: "", faultRemarks: "" }],
        otherComments: "",
        hardwareSupervisorName: "",
        hardwareSupervisorDate: "",
        dateOfLastRepairs: "",
        dateOfPurchase: "",
        numberOfTimesRepaired: "",
        sectionalHeadName: "",
        sectionalHeadDate: "",
        confirmedBy: "",
        confirmedDate: "",
        repairStatus: "",
      })

      onSubmit()
    } catch (err) {
      setError("Failed to submit maintenance request")
      toast({
        title: "Error",
        description: "Failed to submit maintenance request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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
          <Label htmlFor="complaintsFromUsers">Complaints from Users *</Label>
          <Textarea
            id="complaintsFromUsers"
            name="complaintsFromUsers"
            value={formData.complaintsFromUsers}
            onChange={handleInputChange}
            placeholder="Describe the issue or complaint in detail..."
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

      {/* Section B - IT Hardware Group / Initial Diagnosis */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-orange-500/10 text-orange-600 px-2 py-1 rounded text-xs font-semibold">SECTION B</div>
          <h3 className="font-semibold text-sm">Technician Use Only: Initial Diagnosis</h3>
          <span className="text-xs text-muted-foreground">(To be filled by IT Hardware Group)</span>
        </div>

        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border px-3 py-2 text-left text-sm font-medium w-8">#</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium">Part/Item</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium">Make/Serial No</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium">Fault/Remarks</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium w-12">Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.faultItems.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border px-3 py-2 text-sm text-muted-foreground">{index + 1}</td>
                    <td className="border px-1 py-1">
                      <Input
                        value={item.partItem}
                        onChange={(e) => handleFaultItemChange(item.id, "partItem", e.target.value)}
                        placeholder="e.g., Laptop Screen"
                        className="border-0 h-8"
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <Input
                        value={item.makeSerialNo}
                        onChange={(e) => handleFaultItemChange(item.id, "makeSerialNo", e.target.value)}
                        placeholder="e.g., HP-SN12345"
                        className="border-0 h-8"
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <Input
                        value={item.faultRemarks}
                        onChange={(e) => handleFaultItemChange(item.id, "faultRemarks", e.target.value)}
                        placeholder="e.g., Cracked display"
                        className="border-0 h-8"
                      />
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {formData.faultItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFaultItem(item.id)}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <Button type="button" variant="outline" size="sm" onClick={addFaultItem} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>

          <div className="space-y-2">
            <Label htmlFor="otherComments">Any Other Comments</Label>
            <Textarea
              id="otherComments"
              name="otherComments"
              value={formData.otherComments}
              onChange={handleInputChange}
              placeholder="Additional comments from IT technician..."
              className="min-h-16"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hardwareSupervisorName">IT Hardware Supervisor Name</Label>
              <Input
                id="hardwareSupervisorName"
                name="hardwareSupervisorName"
                value={formData.hardwareSupervisorName}
                onChange={handleInputChange}
                placeholder="Supervisor name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hardwareSupervisorDate">Date</Label>
              <Input
                id="hardwareSupervisorDate"
                name="hardwareSupervisorDate"
                type="date"
                value={formData.hardwareSupervisorDate}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </div>

        {/* Repair History */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium text-sm mb-4">Repair History</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfLastRepairs">Date of Last Repairs</Label>
              <Input
                id="dateOfLastRepairs"
                name="dateOfLastRepairs"
                type="date"
                value={formData.dateOfLastRepairs}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfPurchase">Date of Purchase</Label>
              <Input
                id="dateOfPurchase"
                name="dateOfPurchase"
                type="date"
                value={formData.dateOfPurchase}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numberOfTimesRepaired">Times Gadget Repaired</Label>
              <Input
                id="numberOfTimesRepaired"
                name="numberOfTimesRepaired"
                type="number"
                min="0"
                value={formData.numberOfTimesRepaired}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
          </div>
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
            <Label htmlFor="sectionalHeadName">Name of Sectional Head</Label>
            <Input
              id="sectionalHeadName"
              name="sectionalHeadName"
              value={formData.sectionalHeadName}
              onChange={handleInputChange}
              placeholder="HOD name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sectionalHeadDate">Date</Label>
            <Input
              id="sectionalHeadDate"
              name="sectionalHeadDate"
              type="date"
              value={formData.sectionalHeadDate}
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

      {/* Post-Repair Feedback */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Post-Repair Feedback</h3>
          <span className="text-xs text-muted-foreground">(To be filled after repairs)</span>
        </div>

        <div className="space-y-3">
          <Label>Was your repaired IT gadget working properly?</Label>
          <RadioGroup
            value={formData.repairStatus}
            onValueChange={(value) => handleSelectChange("repairStatus", value)}
            className="flex flex-col gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="working_perfectly" id="working_perfectly" />
              <Label htmlFor="working_perfectly" className="font-normal cursor-pointer">
                Working perfectly well now
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="same_condition" id="same_condition" />
              <Label htmlFor="same_condition" className="font-normal cursor-pointer">
                In the same bad condition
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading} size="lg" className="gap-2">
          <Wrench className="h-4 w-4" />
          {loading ? "Submitting..." : "Submit Maintenance Request"}
        </Button>
      </div>
    </form>
  )
}
