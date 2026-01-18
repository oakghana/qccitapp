"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Download,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Wrench,
  Search,
  Eye,
  AlertCircle,
  Filter,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface RepairInvoice {
  id: string
  repair_id: string
  invoice_number: string
  total_amount: number
  labor_cost: number
  parts_cost: number
  other_charges: number
  description: string | null
  labor_hours: number | null
  parts_used: string[] | null
  file_url: string | null
  file_name: string | null
  file_type: string | null
  file_size: number | null
  status: "pending" | "approved" | "rejected"
  reviewed_by: string | null
  reviewed_by_name: string | null
  reviewed_at: string | null
  review_notes: string | null
  uploaded_by: string
  uploaded_by_name: string
  service_provider_id: string
  service_provider_name: string
  created_at: string
  repair: {
    id: string
    task_number: string
    device_name: string
    issue_description: string
    status: string
    location: string
  }
}

export function RepairInvoicesAdmin() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<RepairInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<RepairInvoice | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadInvoices()
  }, [user])

  const loadInvoices = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch("/api/repairs/invoices")
      if (!response.ok) {
        let body = null
        try {
          body = await response.text()
        } catch (e) {
          body = "<unreadable response body>"
        }
        console.error("Failed to load invoices - status:", response.status, "body:", body)
        throw new Error(`Failed to load invoices: ${response.status} ${body}`)
      }

      const data = await response.json()

      // Normalize numeric fields to avoid runtime errors calling toFixed on null
      const normalized = (data.invoices || []).map((inv: any) => ({
        ...inv,
        total_amount: typeof inv.total_amount === "number" ? inv.total_amount : 0,
        labor_cost: typeof inv.labor_cost === "number" ? inv.labor_cost : 0,
        parts_cost: typeof inv.parts_cost === "number" ? inv.parts_cost : 0,
        other_charges: typeof inv.other_charges === "number" ? inv.other_charges : 0,
        labor_hours: typeof inv.labor_hours === "number" ? inv.labor_hours : 0,
        parts_used: Array.isArray(inv.parts_used) ? inv.parts_used : (inv.parts_used ? [inv.parts_used] : []),
      }))

      setInvoices(normalized)
    } catch (error) {
      console.error("Error loading invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateInvoiceStatus = async (invoiceId: string, status: "approved" | "rejected") => {
    if (!user) return

    try {
      const response = await fetch(`/api/repairs/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          reviewed_by: user.id,
          reviewed_by_name: user.name,
          review_notes: reviewNotes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update invoice status")
      }

      // Reload invoices
      loadInvoices()
      setSelectedInvoice(null)
      setReviewNotes("")
    } catch (error) {
      console.error("Error updating invoice:", error)
      alert("Failed to update invoice status")
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    const matchesSearch =
      searchTerm === "" ||
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.repair?.task_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.service_provider_name.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading repair invoices...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Repair Invoices Management
          </CardTitle>
          <CardDescription>
            Review and approve repair invoices uploaded by service providers
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by invoice number, task number, or provider..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Task #</TableHead>
                  <TableHead>Service Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.repair?.task_number}</TableCell>
                      <TableCell>{invoice.service_provider_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {invoice.total_amount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {invoice.file_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(invoice.file_url!, "_blank")}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          )}

                          {invoice.status === "pending" && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedInvoice(invoice)}
                                >
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Review Invoice {invoice.invoice_number}</DialogTitle>
                                </DialogHeader>

                                {selectedInvoice && (
                                  <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                      <div>
                                        <Label className="font-semibold">Task Number</Label>
                                        <p>{selectedInvoice.repair?.task_number}</p>
                                      </div>
                                      <div>
                                        <Label className="font-semibold">Service Provider</Label>
                                        <p>{selectedInvoice.service_provider_name}</p>
                                      </div>
                                    </div>

                                    <div>
                                      <Label className="font-semibold">Device/Issue</Label>
                                      <p>{selectedInvoice.repair?.device_name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedInvoice.repair?.issue_description}
                                      </p>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">
                                      <div>
                                        <Label className="font-semibold">Total Amount</Label>
                                        <p className="text-lg font-bold">GHS {selectedInvoice.total_amount.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <Label className="font-semibold">Labor Cost</Label>
                                        <p>GHS {selectedInvoice.labor_cost.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <Label className="font-semibold">Parts Cost</Label>
                                        <p>GHS {selectedInvoice.parts_cost.toFixed(2)}</p>
                                      </div>
                                    </div>

                                    {Array.isArray((selectedInvoice.repair as any)?.attachments) && (selectedInvoice.repair as any).attachments.length > 0 && (
                                      <div>
                                        <Label className="font-semibold">Related Repair Attachments</Label>
                                        <div className="flex gap-2 flex-wrap mt-2">
                                          {(selectedInvoice.repair as any).attachments.map((att: string, idx: number) => (
                                            <Button
                                              key={idx}
                                              variant="outline"
                                              size="sm"
                                              onClick={() => window.open(att, "_blank")}
                                            >
                                              <FileText className="h-4 w-4 mr-2" />
                                              {att.split("/").pop()}
                                            </Button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {selectedInvoice.description && (
                                      <div>
                                        <Label className="font-semibold">Description</Label>
                                        <p className="text-sm">{selectedInvoice.description}</p>
                                      </div>
                                    )}

                                    {selectedInvoice.parts_used && selectedInvoice.parts_used.length > 0 && (
                                      <div>
                                        <Label className="font-semibold">Parts Used</Label>
                                        <p className="text-sm">{selectedInvoice.parts_used.join(", ")}</p>
                                      </div>
                                    )}

                                    <div>
                                      <Label htmlFor="reviewNotes">Review Notes</Label>
                                      <Textarea
                                        id="reviewNotes"
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Add notes about your review decision..."
                                        rows={3}
                                      />
                                    </div>

                                    <div className="flex gap-2 pt-4">
                                      <Button
                                        onClick={() => updateInvoiceStatus(selectedInvoice.id, "approved")}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve Invoice
                                      </Button>
                                      <Button
                                        onClick={() => updateInvoiceStatus(selectedInvoice.id, "rejected")}
                                        variant="destructive"
                                      >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject Invoice
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}