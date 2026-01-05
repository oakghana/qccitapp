"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, FileText, Search, CheckCircle, Clock, XCircle, Download } from "lucide-react"
import { NewRequisitionForm } from "./new-requisition-form"
import { IssueItemsForm } from "./issue-items-form"

interface Requisition {
  id: string
  sivNumber: string
  requestedBy: string
  department: string
  items: { itemName: string; quantity: number; unit: string }[]
  requestDate: string
  status: "pending" | "approved" | "issued" | "rejected"
  issuedDate?: string
  issuedBy?: string
}

const mockRequisitions: Requisition[] = [
  {
    id: "REQ-2024-001",
    sivNumber: "SIV-2024-001",
    requestedBy: "Kwame Asante",
    department: "IT Support",
    items: [
      { itemName: "HP Laptop Battery", quantity: 2, unit: "pcs" },
      { itemName: "HDMI Cables", quantity: 3, unit: "pcs" },
    ],
    requestDate: "2024-01-15",
    status: "issued",
    issuedDate: "2024-01-16",
    issuedBy: "IT Head",
  },
  {
    id: "REQ-2024-002",
    sivNumber: "SIV-2024-002",
    requestedBy: "Ama Osei",
    department: "Finance",
    items: [{ itemName: "HP Printer Toner (Black)", quantity: 1, unit: "pcs" }],
    requestDate: "2024-01-20",
    status: "pending",
  },
]

const statusConfig = {
  pending: { icon: Clock, color: "secondary", label: "Pending" },
  approved: { icon: CheckCircle, color: "default", label: "Approved" },
  issued: { icon: CheckCircle, color: "default", label: "Issued" },
  rejected: { icon: XCircle, color: "destructive", label: "Rejected" },
}

export function RequisitionManagement() {
  const [requisitions, setRequisitions] = useState<Requisition[]>(mockRequisitions)
  const [searchTerm, setSearchTerm] = useState("")
  const [newReqOpen, setNewReqOpen] = useState(false)
  const [issueOpen, setIssueOpen] = useState(false)
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null)

  const filteredRequisitions = requisitions.filter(
    (req) =>
      req.sivNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getFilteredByStatus = (status: string) => {
    if (status === "all") return filteredRequisitions
    return filteredRequisitions.filter((req) => req.status === status)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Store Requisitions</h1>
          <p className="text-muted-foreground">Manage IT item requisitions and issuances (SIV)</p>
        </div>
        <Dialog open={newReqOpen} onOpenChange={setNewReqOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Requisition
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Store Requisition</DialogTitle>
              <DialogDescription>Request IT items from the store inventory</DialogDescription>
            </DialogHeader>
            <NewRequisitionForm onSubmit={() => setNewReqOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by SIV number or requester name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="issued">Issued</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        {["all", "pending", "approved", "issued", "rejected"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {getFilteredByStatus(status).map((req) => {
              const StatusIcon = statusConfig[req.status].icon
              return (
                <Card key={req.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {req.sivNumber}
                        </CardTitle>
                        <CardDescription>Requested by {req.requestedBy}</CardDescription>
                      </div>
                      <Badge variant={statusConfig[req.status].color as any}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[req.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Department</p>
                        <p className="font-medium">{req.department}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Request Date</p>
                        <p className="font-medium">{new Date(req.requestDate).toLocaleDateString()}</p>
                      </div>
                      {req.issuedDate && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Issued Date</p>
                            <p className="font-medium">{new Date(req.issuedDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Issued By</p>
                            <p className="font-medium">{req.issuedBy}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Items Requested</p>
                      <div className="space-y-2">
                        {req.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                            <span className="font-medium">{item.itemName}</span>
                            <Badge variant="outline">
                              {item.quantity} {item.unit}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {req.status === "approved" && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedReq(req)
                            setIssueOpen(true)
                          }}
                          className="flex-1"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Issue Items (SIV)
                        </Button>
                      </div>
                    )}

                    {req.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          onClick={() => {
                            setRequisitions(
                              requisitions.map((r) => (r.id === req.id ? { ...r, status: "approved" } : r)),
                            )
                          }}
                          className="flex-1"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setRequisitions(
                              requisitions.map((r) => (r.id === req.id ? { ...r, status: "rejected" } : r)),
                            )
                          }}
                          className="flex-1"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {getFilteredByStatus(status).length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No requisitions found</h3>
                  <p className="text-muted-foreground text-center">
                    No requisitions match your current filter criteria.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Items - {selectedReq?.sivNumber}</DialogTitle>
            <DialogDescription>Record the issuance of items to {selectedReq?.requestedBy}</DialogDescription>
          </DialogHeader>
          {selectedReq && (
            <IssueItemsForm
              requisition={selectedReq}
              onSubmit={() => {
                setRequisitions(
                  requisitions.map((r) =>
                    r.id === selectedReq.id
                      ? { ...r, status: "issued", issuedDate: new Date().toISOString(), issuedBy: "IT Head" }
                      : r,
                  ),
                )
                setIssueOpen(false)
                setSelectedReq(null)
              }}
              onCancel={() => {
                setIssueOpen(false)
                setSelectedReq(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
