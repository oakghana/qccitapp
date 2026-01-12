"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { canSeeAllLocations } from "@/lib/location-filter"
import { getLocationOptions } from "@/lib/locations"

interface Requisition {
  id: string
  requisition_number: string
  requested_by: string
  beneficiary?: string
  location: string
  items: { itemName: string; quantity: number; unit: string; item_id?: string }[]
  created_at: string
  status: "pending" | "approved" | "issued" | "rejected"
  updated_at?: string
  issued_by?: string
  approved_by?: string
  notes?: string
  allocated_to_location?: string
  allocation_date?: string
  allocated_by?: string
}

const statusConfig = {
  pending: { icon: Clock, color: "secondary", label: "Pending" },
  approved: { icon: CheckCircle, color: "default", label: "Approved" },
  issued: { icon: CheckCircle, color: "default", label: "Issued" },
  rejected: { icon: XCircle, color: "destructive", label: "Rejected" },
}

export function RequisitionManagement() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [newReqOpen, setNewReqOpen] = useState(false)
  const [issueOpen, setIssueOpen] = useState(false)
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null)
  const [allocateOpen, setAllocateOpen] = useState(false)
  const [allocatingReq, setAllocatingReq] = useState<Requisition | null>(null)
  const [allocateLocation, setAllocateLocation] = useState("")
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    loadRequisitions()
  }, [])

  const loadRequisitions = async () => {
    try {
      setLoading(true)
      let query = supabase.from("store_requisitions").select("*").order("created_at", { ascending: false })

      if (user && !canSeeAllLocations(user) && user.location) {
        query = query.or(`location.eq.${user.location},location.eq.Central Stores`)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error loading requisitions:", error)
        return
      }

      console.log("[v0] Loaded requisitions from Supabase:", data)

      const mappedRequisitions: Requisition[] = data.map((req: any) => ({
        id: req.id,
        requisition_number: req.requisition_number || `SIV-${req.id.slice(0, 8)}`,
        requested_by: req.requested_by,
        beneficiary: req.beneficiary,
        location: req.location || "Unknown",
        items: Array.isArray(req.items) ? req.items : [],
        created_at: req.created_at,
        status: req.status,
        updated_at: req.updated_at,
        issued_by: req.issued_by,
        approved_by: req.approved_by,
        notes: req.notes,
        allocated_to_location: req.allocated_to_location,
        allocation_date: req.allocation_date,
        allocated_by: req.allocated_by,
      }))

      setRequisitions(mappedRequisitions)
    } catch (error) {
      console.error("[v0] Error loading requisitions:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateRequisitionStatus = async (reqId: string, newStatus: "approved" | "rejected", approvedBy?: string) => {
    try {
      const { error } = await supabase
        .from("store_requisitions")
        .update({
          status: newStatus,
          approved_by: approvedBy,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reqId)

      if (error) {
        console.error("[v0] Error updating requisition:", error)
        return
      }

      await loadRequisitions()
    } catch (error) {
      console.error("[v0] Error updating requisition:", error)
    }
  }

  const issueRequisition = async (reqId: string, issuedBy: string) => {
    try {
      const { error } = await supabase
        .from("store_requisitions")
        .update({
          status: "issued",
          issued_by: issuedBy,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reqId)

      if (error) {
        console.error("[v0] Error issuing requisition:", error)
        return
      }

      await loadRequisitions()
    } catch (error) {
      console.error("[v0] Error issuing requisition:", error)
    }
  }

  const allocateRequisition = async () => {
    if (!allocatingReq || !allocateLocation) return

    try {
      const response = await fetch("/api/store/allocate-requisition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requisitionId: allocatingReq.id,
          approvedBy: user?.full_name || "Admin",
          allocateToLocation: allocateLocation,
        }),
      })

      if (!response.ok) {
        console.error("[v0] Error allocating requisition")
        return
      }

      setAllocateOpen(false)
      setAllocatingReq(null)
      setAllocateLocation("")
      await loadRequisitions()
    } catch (error) {
      console.error("[v0] Error allocating requisition:", error)
    }
  }

  const filteredRequisitions = requisitions.filter(
    (req) =>
      req.requisition_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requested_by.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getFilteredByStatus = (status: string) => {
    if (status === "all") return filteredRequisitions
    return filteredRequisitions.filter((req) => req.status === status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading requisitions...</p>
      </div>
    )
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
                          {req.requisition_number}
                        </CardTitle>
                        <CardDescription>Requested by {req.requested_by}</CardDescription>
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
                        <p className="font-medium">{req.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Request Date</p>
                        <p className="font-medium">{new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                      {req.updated_at && req.status === "issued" && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Issued Date</p>
                            <p className="font-medium">{new Date(req.updated_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Issued By</p>
                            <p className="font-medium">{req.issued_by || "N/A"}</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Items Requested</p>
                      <div className="space-y-2">
                        {req.items.length > 0 ? (
                          req.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                              <span className="font-medium">{item.itemName}</span>
                              <Badge variant="outline">
                                {item.quantity} {item.unit}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No items listed</p>
                        )}
                      </div>
                    </div>

                    {req.allocated_to_location && (
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-sm font-medium text-primary mb-1">Allocated to Location</p>
                        <p className="text-sm">{req.allocated_to_location}</p>
                        {req.allocation_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Allocated on {new Date(req.allocation_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

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
                            setAllocatingReq(req)
                            setAllocateLocation(req.location)
                            setAllocateOpen(true)
                          }}
                          className="flex-1"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve & Allocate
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => updateRequisitionStatus(req.id, "rejected")}
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

      <Dialog open={allocateOpen} onOpenChange={setAllocateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve & Allocate Requisition</DialogTitle>
            <DialogDescription>
              Allocate items to {allocatingReq?.requested_by} at their location. Stock will be transferred from Head
              Office to the regional inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allocateLocation">Allocate to Location *</Label>
              <Select value={allocateLocation} onValueChange={setAllocateLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {getLocationOptions().map((location) => (
                    <SelectItem key={location.value} value={location.label}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {allocatingReq && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Items to Allocate:</p>
                {allocatingReq.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                    <span>{item.itemName}</span>
                    <Badge variant="outline">
                      {item.quantity} {item.unit}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAllocateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={allocateRequisition} disabled={!allocateLocation}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve & Allocate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Issue Items - {selectedReq?.requisition_number}</DialogTitle>
            <DialogDescription>Record the issuance of items to {selectedReq?.requested_by}</DialogDescription>
          </DialogHeader>
          {selectedReq && (
            <IssueItemsForm
              requisition={selectedReq}
              onSubmit={() => {
                if (selectedReq) {
                  issueRequisition(selectedReq.id, "Store Manager")
                }
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
