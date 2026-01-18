"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  FileText,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Wrench,
  Search,
  Eye,
  FileUp,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface RepairTask {
  id: string
  task_number: string
  device_name: string
  issue_description: string
  priority: string
  status: string
  location: string
  estimated_cost: number | null
  actual_cost: number | null
  has_invoice: boolean
  invoice_approved: boolean
  created_at: string
  service_provider_id: string
  service_provider: string
}

interface Invoice {
  id: string
  repair_id: string
  invoice_number: string
  invoice_date: string
  total_amount: number
  labor_cost: number
  parts_cost: number
  other_charges: number
  description: string | null
  labor_hours: number | null
  parts_used: string[] | null
  file_url: string | null
  file_name: string | null
  status: "pending" | "approved" | "rejected" | "paid"
  approval_notes: string | null
  created_at: string
  repair?: RepairTask
}

export function ServiceProviderInvoices() {
  const { user } = useAuth()
  const [repairs, setRepairs] = useState<RepairTask[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRepair, setSelectedRepair] = useState<RepairTask | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [laborCost, setLaborCost] = useState("")
  const [partsCost, setPartsCost] = useState("")
  const [otherCharges, setOtherCharges] = useState("")
  const [description, setDescription] = useState("")
  const [laborHours, setLaborHours] = useState("")
  const [partsUsed, setPartsUsed] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    loadRepairsAndInvoices()
  }, [user])

  const loadRepairsAndInvoices = async () => {
    setLoading(true)
    try {
      // Resolve service provider id for provider users so we only show assigned repairs
      let localProviderId: string | null = null
      if (user?.role === "service_provider") {
        try {
          const provRes = await fetch(`/api/admin/service-providers?activeOnly=true`)
          if (provRes.ok) {
            const provJson = await provRes.json()
            const providers: any[] = provJson.providers || []
            const match = providers.find((p) => p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase())
            if (match) {
              localProviderId = String(match.id)
            }
          }
        } catch (e) {
          console.warn('[v0] Failed to resolve service provider id', e)
        }
      }

      // Fetch repairs assigned to this provider (if service provider), otherwise load all eligible repairs
      let repairsData: any = { repairs: [] }
      if (user?.role === "service_provider" && localProviderId) {
        const resp = await fetch(`/api/repairs/tasks?service_provider_id=${localProviderId}`)
        repairsData = await resp.json()
      } else {
        const resp = await fetch(`/api/repairs?canSeeAll=true`)
        repairsData = await resp.json()
      }

      if (repairsData.repairs || repairsData.tasks) {
        const source = repairsData.repairs || repairsData.tasks || []
        // Filter repairs that are in repair or completed status and don't already have an invoice
        const eligibleRepairs = source.filter((r: any) => ["in_repair", "completed", "returned"].includes(r.status) && !r.has_invoice)
        setRepairs(eligibleRepairs)
      }

      // Load existing invoices - admins and IT head see invoices; service providers should not see uploaded invoices
      if (user?.role === "service_provider") {
        setInvoices([])
      } else {
        let invoicesResponse = await fetch(`/api/repairs/invoices`)
        const invoicesData = await invoicesResponse.json()
        if (invoicesData.invoices) {
          setInvoices(invoicesData.invoices)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
      if (!allowedTypes.includes(file.type)) {
        alert("Please select a PDF or image file (JPG, PNG)")
        return
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }
      setSelectedFile(file)
    }
  }

  const calculateTotal = () => {
    const labor = parseFloat(laborCost) || 0
    const parts = parseFloat(partsCost) || 0
    const other = parseFloat(otherCharges) || 0
    return (labor + parts + other).toFixed(2)
  }

  const handleUploadInvoice = async () => {
    if (!selectedRepair || !invoiceNumber) {
      alert("Please fill in required fields")
      return
    }

    const total = parseFloat(calculateTotal())
    if (total <= 0) {
      alert("Total amount must be greater than 0")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("repairId", selectedRepair.id)
      formData.append("invoiceNumber", invoiceNumber)
      formData.append("invoiceDate", invoiceDate)
      formData.append("totalAmount", total.toString())
      formData.append("laborCost", laborCost || "0")
      formData.append("partsCost", partsCost || "0")
      formData.append("otherCharges", otherCharges || "0")
      formData.append("description", description)
      formData.append("laborHours", laborHours || "0")
      formData.append("partsUsed", partsUsed)
      formData.append("uploadedBy", user?.id || "")
      formData.append("uploadedByName", user?.name || "Service Provider")
      formData.append("serviceProviderId", selectedRepair.service_provider_id || "")
      formData.append("serviceProviderName", selectedRepair.service_provider || "")

      if (selectedFile) {
        formData.append("file", selectedFile)
      }

      const response = await fetch("/api/repairs/invoices", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload invoice")
      }

      // Reset form and reload data
      resetForm()
      setShowUploadDialog(false)
      await loadRepairsAndInvoices()
      alert("Invoice uploaded successfully!")
    } catch (error) {
      console.error("[v0] Error uploading invoice:", error)
      alert("Error uploading invoice: " + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setInvoiceNumber("")
    setInvoiceDate(new Date().toISOString().split("T")[0])
    setLaborCost("")
    setPartsCost("")
    setOtherCharges("")
    setDescription("")
    setLaborHours("")
    setPartsUsed("")
    setSelectedFile(null)
    setSelectedRepair(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case "paid":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><DollarSign className="h-3 w-3 mr-1" />Paid</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredRepairs = repairs.filter((repair) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      repair.task_number?.toLowerCase().includes(searchLower) ||
      repair.device_name?.toLowerCase().includes(searchLower) ||
      repair.issue_description?.toLowerCase().includes(searchLower)
    )
  })

  const filteredInvoices = invoices.filter((invoice) => {
    if (activeTab === "all") return true
    return invoice.status === activeTab
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Repair Invoices</h1>
            <p className="text-muted-foreground">
              Upload invoices for completed repairs
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <div className="text-2xl font-bold">{invoices.filter(i => i.status === "pending").length}</div>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <div className="text-2xl font-bold">{invoices.filter(i => i.status === "approved").length}</div>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
            <div className="text-2xl font-bold">{invoices.filter(i => i.status === "paid").length}</div>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            <div className="text-xl font-bold">
              GHS {invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0).toFixed(2)}
            </div>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Upload</TabsTrigger>
          <TabsTrigger value="submitted">My Invoices</TabsTrigger>
        </TabsList>

        {/* Pending Upload Tab - Repairs awaiting invoices */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Repairs Awaiting Invoices
              </CardTitle>
              <CardDescription>
                Upload invoices for completed repair tasks
              </CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search repairs..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {filteredRepairs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No repairs awaiting invoices</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task #</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Est. Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRepairs.map((repair) => (
                      <TableRow key={repair.id}>
                        <TableCell className="font-medium">{repair.task_number}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{repair.device_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{repair.issue_description}</TableCell>
                        <TableCell>{repair.location}</TableCell>
                        <TableCell>
                          {repair.estimated_cost ? `GHS ${repair.estimated_cost.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{repair.status.replace("_", " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog open={showUploadDialog && selectedRepair?.id === repair.id} onOpenChange={(open) => {
                            setShowUploadDialog(open)
                            if (open) setSelectedRepair(repair)
                            else resetForm()
                          }}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <Upload className="h-4 w-4 mr-1" />
                                Upload Invoice
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Upload Invoice for {repair.task_number}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                {/* Repair Details */}
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                  <p className="text-sm"><strong>Device:</strong> {repair.device_name}</p>
                                  <p className="text-sm"><strong>Issue:</strong> {repair.issue_description}</p>
                                  {repair.estimated_cost && (
                                    <p className="text-sm"><strong>Estimated Cost:</strong> GHS {repair.estimated_cost.toFixed(2)}</p>
                                  )}
                                </div>

                                {/* Invoice Form */}
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                                    <Input
                                      id="invoiceNumber"
                                      value={invoiceNumber}
                                      onChange={(e) => setInvoiceNumber(e.target.value)}
                                      placeholder="INV-001"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="invoiceDate">Invoice Date</Label>
                                    <Input
                                      id="invoiceDate"
                                      type="date"
                                      value={invoiceDate}
                                      onChange={(e) => setInvoiceDate(e.target.value)}
                                    />
                                  </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                  <div>
                                    <Label htmlFor="laborCost">Labor Cost (GHS)</Label>
                                    <Input
                                      id="laborCost"
                                      type="number"
                                      step="0.01"
                                      value={laborCost}
                                      onChange={(e) => setLaborCost(e.target.value)}
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="partsCost">Parts Cost (GHS)</Label>
                                    <Input
                                      id="partsCost"
                                      type="number"
                                      step="0.01"
                                      value={partsCost}
                                      onChange={(e) => setPartsCost(e.target.value)}
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="otherCharges">Other Charges (GHS)</Label>
                                    <Input
                                      id="otherCharges"
                                      type="number"
                                      step="0.01"
                                      value={otherCharges}
                                      onChange={(e) => setOtherCharges(e.target.value)}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>

                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">Total Amount:</span>
                                    <span className="text-xl font-bold text-blue-600">GHS {calculateTotal()}</span>
                                  </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="laborHours">Labor Hours</Label>
                                    <Input
                                      id="laborHours"
                                      type="number"
                                      step="0.5"
                                      value={laborHours}
                                      onChange={(e) => setLaborHours(e.target.value)}
                                      placeholder="0"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="partsUsed">Parts Used (comma separated)</Label>
                                    <Input
                                      id="partsUsed"
                                      value={partsUsed}
                                      onChange={(e) => setPartsUsed(e.target.value)}
                                      placeholder="Keyboard, Screen, Battery"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="description">Work Description</Label>
                                  <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the repair work performed..."
                                    rows={3}
                                  />
                                </div>

                                <div>
                                  <Label>Upload Invoice Document (PDF or Image)</Label>
                                  <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center">
                                    <input
                                      ref={fileInputRef}
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      onChange={handleFileSelect}
                                      className="hidden"
                                      id="invoice-file"
                                    />
                                    <label htmlFor="invoice-file" className="cursor-pointer">
                                      {selectedFile ? (
                                        <div className="flex items-center justify-center gap-2 text-green-600">
                                          <FileText className="h-6 w-6" />
                                          <span>{selectedFile.name}</span>
                                        </div>
                                      ) : (
                                        <div className="text-muted-foreground">
                                          <FileUp className="h-8 w-8 mx-auto mb-2" />
                                          <p>Click to upload invoice file</p>
                                          <p className="text-xs">PDF, JPG, PNG (max 10MB)</p>
                                        </div>
                                      )}
                                    </label>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                  <Button variant="outline" onClick={() => {
                                    setShowUploadDialog(false)
                                    resetForm()
                                  }}>
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleUploadInvoice}
                                    disabled={uploading || !invoiceNumber || parseFloat(calculateTotal()) <= 0}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {uploading ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Uploading...
                                      </>
                                    ) : (
                                      <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Submit Invoice
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Invoices Tab */}
        <TabsContent value="submitted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submitted Invoices
              </CardTitle>
              <CardDescription>
                Track the status of your submitted invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No invoices submitted yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Repair Task</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>File</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.repair?.task_number || "-"}</TableCell>
                        <TableCell>{new Date(invoice.invoice_date || invoice.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">GHS {invoice.total_amount?.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          {invoice.file_url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(invoice.file_url!, "_blank")}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">No file</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
