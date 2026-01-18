"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Check,
  X,
  Download,
  FileText,
  DollarSign,
  Clock,
  User,
  FileCheck,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface RepairInvoice {
  id: string
  repair_id: {
    id: string
    task_number: string
    issue_description: string
    status: string
  }
  service_provider_name: string
  invoice_number: string
  invoice_date: string
  total_amount: number
  labor_cost: number
  parts_cost: number
  other_charges: number
  labor_hours: number
  file_url: string
  file_name: string
  status: "pending" | "approved" | "rejected"
  uploaded_by_name: string
  uploaded_at: string
  approved_by_name: string
  approved_at: string
  approval_notes: string
  description: string
  created_at: string
}

export function AdminInvoiceManagement() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<RepairInvoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<RepairInvoice[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<RepairInvoice | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [approvalNotes, setApprovalNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  useEffect(() => {
    loadInvoices()
  }, [user])

  const loadInvoices = async () => {
    if (!user || (user.role !== "admin" && user.role !== "it_head")) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/repairs/invoice/approve?status=all&userRole=${user.role}`)

      if (!response.ok) {
        throw new Error("Failed to load invoices")
      }

      const { invoices: data } = await response.json()
      console.log("[v0] Loaded invoices:", data.length)
      setInvoices(data || [])
    } catch (error) {
      console.error("[v0] Error loading invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = invoices

    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.service_provider_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.repair_id.task_number.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredInvoices(filtered)
  }, [invoices, statusFilter, searchQuery])

  const handleApproveInvoice = async () => {
    if (!selectedInvoice) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/repairs/invoice/approve", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          action: "approve",
          approvalNotes,
          approvedBy: user?.id,
          approvedByName: user?.name,
          userRole: user?.role,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve invoice")
      }

      const result = await response.json()

      // Update local state
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvoice.id
            ? {
                ...inv,
                status: "approved",
                approved_by_name: user?.name,
                approved_at: new Date().toISOString(),
                approval_notes: approvalNotes,
              }
            : inv,
        ),
      )

      alert("Invoice approved successfully")
      setApprovalDialogOpen(false)
      setSelectedInvoice(null)
      setApprovalNotes("")
    } catch (error) {
      console.error("[v0] Error approving invoice:", error)
      alert(error instanceof Error ? error.message : "Failed to approve invoice")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRejectInvoice = async () => {
    if (!selectedInvoice) return

    setIsProcessing(true)
    try {
      const response = await fetch("/api/repairs/invoice/approve", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          action: "reject",
          approvalNotes,
          approvedBy: user?.id,
          approvedByName: user?.name,
          userRole: user?.role,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject invoice")
      }

      // Update local state
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === selectedInvoice.id
            ? {
                ...inv,
                status: "rejected",
                approval_notes: approvalNotes,
              }
            : inv,
        ),
      )

      alert("Invoice rejected successfully")
      setRejectDialogOpen(false)
      setSelectedInvoice(null)
      setApprovalNotes("")
    } catch (error) {
      console.error("[v0] Error rejecting invoice:", error)
      alert(error instanceof Error ? error.message : "Failed to reject invoice")
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const stats = {
    total: invoices.length,
    pending: invoices.filter((i) => i.status === "pending").length,
    approved: invoices.filter((i) => i.status === "approved").length,
    rejected: invoices.filter((i) => i.status === "rejected").length,
    totalAmount: invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center shadow-lg">
            <FileCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Invoice Management</h1>
            <p className="text-muted-foreground">Review and approve service provider repair invoices</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
            <div className="text-2xl font-bold">GHS {stats.totalAmount.toFixed(2)}</div>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search invoices
              </Label>
              <Input
                id="search"
                placeholder="Search by invoice number, provider, or task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
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
        </CardHeader>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {loading ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Loading invoices...</p>
              </CardContent>
            </Card>
          ) : filteredInvoices.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">No invoices found</p>
                <p className="text-muted-foreground">No invoices match your current filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">Invoice #{invoice.invoice_number}</CardTitle>
                          <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{invoice.service_provider_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span>{invoice.repair_id.task_number}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(invoice.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">GHS {invoice.total_amount?.toFixed(2)}</span>
                            </div>
                            {invoice.labor_hours && (
                              <div>
                                <p className="text-xs text-muted-foreground">Labor: {invoice.labor_hours}h</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-col md:flex-row">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="flex items-center gap-2 bg-transparent"
                        >
                          <a href={invoice.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                            Download
                          </a>
                        </Button>

                        {invoice.status === "pending" && (
                          <>
                            <Dialog open={approvalDialogOpen && selectedInvoice?.id === invoice.id} onOpenChange={setApprovalDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedInvoice(invoice)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Approve Invoice</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label className="font-semibold">Invoice Details</Label>
                                    <div className="bg-muted p-3 rounded-lg space-y-2 text-sm mt-2">
                                      <p>
                                        <strong>Invoice:</strong> {selectedInvoice?.invoice_number}
                                      </p>
                                      <p>
                                        <strong>Provider:</strong> {selectedInvoice?.service_provider_name}
                                      </p>
                                      <p>
                                        <strong>Amount:</strong> GHS {selectedInvoice?.total_amount?.toFixed(2)}
                                      </p>
                                      <p>
                                        <strong>Task:</strong> {selectedInvoice?.repair_id.task_number}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
                                    <Textarea
                                      id="approvalNotes"
                                      placeholder="Add any notes or comments..."
                                      value={approvalNotes}
                                      onChange={(e) => setApprovalNotes(e.target.value)}
                                    />
                                  </div>

                                  <Button
                                    onClick={handleApproveInvoice}
                                    disabled={isProcessing}
                                    className="w-full bg-green-600 hover:bg-green-700"
                                  >
                                    {isProcessing ? "Processing..." : "Approve Invoice"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Dialog open={rejectDialogOpen && selectedInvoice?.id === invoice.id} onOpenChange={setRejectDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedInvoice(invoice)}
                                  variant="destructive"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Reject Invoice</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                    <div className="flex gap-2">
                                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="font-semibold text-red-900 dark:text-red-300">Provide Reason for Rejection</p>
                                        <p className="text-sm text-red-700 dark:text-red-400">The service provider will be notified and asked to resubmit.</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <Label htmlFor="rejectionNotes">Reason for Rejection</Label>
                                    <Textarea
                                      id="rejectionNotes"
                                      placeholder="Explain why the invoice is being rejected..."
                                      value={approvalNotes}
                                      onChange={(e) => setApprovalNotes(e.target.value)}
                                    />
                                  </div>

                                  <Button
                                    onClick={handleRejectInvoice}
                                    disabled={isProcessing || !approvalNotes}
                                    variant="destructive"
                                    className="w-full"
                                  >
                                    {isProcessing ? "Processing..." : "Reject Invoice"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </>
                        )}

                        {invoice.status !== "pending" && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>Invoice Details - {invoice.invoice_number}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="font-semibold">Service Provider</Label>
                                    <p className="text-sm">{invoice.service_provider_name}</p>
                                  </div>
                                  <div>
                                    <Label className="font-semibold">Invoice Date</Label>
                                    <p className="text-sm">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="font-semibold">Cost Breakdown</Label>
                                  <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                                    {invoice.labor_cost && (
                                      <div className="flex justify-between">
                                        <span>Labor Cost:</span>
                                        <span>GHS {invoice.labor_cost.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {invoice.parts_cost && (
                                      <div className="flex justify-between">
                                        <span>Parts Cost:</span>
                                        <span>GHS {invoice.parts_cost.toFixed(2)}</span>
                                      </div>
                                    )}
                                    {invoice.other_charges && (
                                      <div className="flex justify-between">
                                        <span>Other Charges:</span>
                                        <span>GHS {invoice.other_charges.toFixed(2)}</span>
                                      </div>
                                    )}
                                    <div className="border-t pt-2 flex justify-between font-semibold">
                                      <span>Total Amount:</span>
                                      <span>GHS {invoice.total_amount?.toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                {invoice.approval_notes && (
                                  <div>
                                    <Label className="font-semibold">
                                      {invoice.status === "approved" ? "Approval" : "Rejection"} Notes
                                    </Label>
                                    <p className="text-sm bg-muted p-3 rounded-lg">{invoice.approval_notes}</p>
                                  </div>
                                )}

                                {invoice.description && (
                                  <div>
                                    <Label className="font-semibold">Description</Label>
                                    <p className="text-sm bg-muted p-3 rounded-lg">{invoice.description}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
