"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Package,
  UserPlus,
  AlertCircle,
  CheckCircle,
  History,
  Download,
  RefreshCw,
  Filter,
  Laptop,
  Printer,
  Monitor,
  Keyboard,
  Mouse,
  HardDrive,
  Edit,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { LOCATIONS } from "@/lib/locations"
import { downloadCSV } from "@/lib/export-utils"
import { useToast } from "@/hooks/use-toast"

interface StockItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  location: string
  sku?: string
  reorder_level?: number
}

interface StaffMember {
  id: string
  name: string
  email: string
  department?: string
  location?: string
  role?: string
}

interface StockAssignment {
  id: string
  item_id: string
  item_name: string
  quantity: number
  assigned_to: string
  assigned_to_email?: string
  department: string
  office_location?: string
  room_number?: string
  location: string
  status: string
  assigned_by: string
  assigned_by_role: string
  requisition_number?: string
  is_replacement: boolean
  replacement_reason?: string
  is_hardware: boolean
  devices_created: number
  notes?: string
  created_at: string
}

const categoryIcons: Record<string, any> = {
  "Computers": Laptop,
  "Printers": Printer,
  "Monitors": Monitor,
  "Peripherals": Keyboard,
  "Hardware": HardDrive,
}

export function AssignStockToStaff() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [assignments, setAssignments] = useState<StockAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)

  // Edit assignment state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<StockAssignment | null>(null)
  const [editForm, setEditForm] = useState({
    assigned_to: "",
    assigned_to_email: "",
    department: "",
    office_location: "",
    room_number: "",
    notes: "",
  })
  const [editLoading, setEditLoading] = useState(false)

  // Assignment form state
  const [assignmentForm, setAssignmentForm] = useState({
    assigned_to_name: "",
    assigned_to_email: "",
    department: "",
    room_number: "",
    requisition_number: "",
    is_replacement: false,
    replacement_reason: "",
    quantity: 1,
    notes: "",
  })

  const locationOptions = Object.entries(LOCATIONS).map(([value, label]) => ({
    value,
    label,
  }))

  // Check if user has permission to assign stock
  const canAssignStock = ["admin", "it_store_head", "regional_it_head"].includes(user?.role || "")

  useEffect(() => {
    if (canAssignStock) {
      loadStockItems()
      loadStaffList()
      loadAssignments()
    }
  }, [user?.location])

  const loadStockItems = async () => {
    try {
      const location = user?.location || ""
      const canSeeAll = user?.role === "admin" || user?.role === "it_store_head"
      
      const params = new URLSearchParams({
        location: location,
        canSeeAll: String(canSeeAll),
      })
      
      const response = await fetch(`/api/store/items?${params}`)
      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Error loading stock items:", result.error)
        return
      }

      // Filter items with quantity > 0 and apply strict role-based restrictions
      let availableItems = (result.items || []).filter((item: StockItem) => item.quantity > 0)

      // CRITICAL: Always exclude Central Stores - direct assignment is never allowed
      availableItems = availableItems.filter((item: StockItem) => 
        item.location !== "central_stores" && 
        item.location !== "Central Stores"
      )

      // Apply additional role-based filtering
      if (user?.role === "it_store_head") {
        // IT Store Head can ONLY see Head Office items
        availableItems = availableItems.filter((item: StockItem) => 
          item.location === "head_office" || item.location === "Head Office"
        )
        console.log("[v0] IT Store Head - filtered to Head Office items:", availableItems.length)
      } else if (user?.role === "regional_it_head") {
        // Regional IT Head can ONLY see their specific location items
        const userLocation = user.location || ""
        availableItems = availableItems.filter((item: StockItem) => 
          item.location === userLocation || 
          item.location?.toLowerCase() === userLocation?.toLowerCase()
        )
        console.log(`[v0] Regional IT Head - filtered to ${userLocation} items:`, availableItems.length)
      } else if (user?.role === "admin") {
        // Admin can see all items except central stores (already filtered above)
        console.log("[v0] Admin - showing all non-Central Stores items:", availableItems.length)
      }

      setStockItems(availableItems)
    } catch (error) {
      console.error("[v0] Error loading stock items:", error)
    }
  }

  const loadStaffList = async () => {
    try {
      const params = new URLSearchParams({
        role: "all_users",
        location: user?.location || "all",
        userRole: user?.role || "",
      })
      
      const response = await fetch(`/api/staff/list?${params}`)
      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] Error loading staff list:", result.error)
        return
      }

      setStaffList(result.staff || [])
    } catch (error) {
      console.error("[v0] Error loading staff list:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssignments = async () => {
    try {
      const params = new URLSearchParams({
        location: user?.location || "",
        canSeeAll: String(user?.role === "admin" || user?.role === "it_store_head"),
      })
      
      const response = await fetch(`/api/store/assignments?${params}`)
      const result = await response.json()

      if (response.ok) {
        setAssignments(result.assignments || [])
      }
    } catch (error) {
      console.error("[v0] Error loading assignments:", error)
    }
  }

  const handleAssignItem = (item: StockItem) => {
    setSelectedItem(item)
    setAssignmentForm({
      assigned_to_name: "",
      assigned_to_email: "",
      department: "",
      room_number: "",
      requisition_number: "",
      is_replacement: false,
      replacement_reason: "",
      quantity: 1,
      notes: "",
    })
    setError("")
    setSuccess("")
    setAssignDialogOpen(true)
  }

  const handleStaffSelect = (staffId: string) => {
    const staff = staffList.find(s => s.id === staffId)
    if (staff) {
      setAssignmentForm(prev => ({
        ...prev,
        assigned_to_name: staff.name,
        assigned_to_email: staff.email || "",
        department: staff.department || prev.department,
      }))
    }
  }

  const handleSubmitAssignment = async () => {
    if (!selectedItem) return

    // Validation
    if (!assignmentForm.assigned_to_name.trim()) {
      setError("Please select or enter the name of the person to assign the item to")
      return
    }
    if (!assignmentForm.department.trim()) {
      setError("Please enter the department")
      return
    }
    if (assignmentForm.quantity < 1) {
      setError("Quantity must be at least 1")
      return
    }
    if (assignmentForm.quantity > selectedItem.quantity) {
      setError(`Insufficient stock. Available: ${selectedItem.quantity}`)
      return
    }
    if (assignmentForm.is_replacement && !assignmentForm.replacement_reason.trim()) {
      setError("Please provide a reason for replacement")
      return
    }

    setAssignmentLoading(true)
    setError("")

    try {
      const response = await fetch("/api/store/assign-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: selectedItem.id,
          assigned_to_name: assignmentForm.assigned_to_name.trim(),
          assigned_to_email: assignmentForm.assigned_to_email.trim(),
          department: assignmentForm.department.trim(),
          room_number: assignmentForm.room_number.trim(),
          requisition_number: assignmentForm.requisition_number.trim(),
          is_replacement: assignmentForm.is_replacement,
          replacement_reason: assignmentForm.replacement_reason.trim(),
          notes: assignmentForm.notes.trim(),
          quantity: assignmentForm.quantity,
          location: selectedItem.location,
          assigned_by: user?.full_name || user?.name || user?.username,
          assigned_by_role: user?.role,
          user_location: user?.location,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to assign item")
        toast({
          title: "Error",
          description: result.error || "Failed to assign item",
          variant: "destructive",
        })
        return
      }

      setSuccess(`Successfully assigned ${assignmentForm.quantity} ${selectedItem.name} to ${assignmentForm.assigned_to_name}`)
      toast({
        title: "✅ Item Assigned",
        description: `Successfully assigned ${assignmentForm.quantity} ${selectedItem.name} to ${assignmentForm.assigned_to_name}`,
      })
      
      // Refresh data
      await loadStockItems()
      await loadAssignments()
      
      // Close dialog after short delay to show success message
      setTimeout(() => {
        setAssignDialogOpen(false)
        setSuccess("")
      }, 2000)

      // Trigger inventory refresh event
      window.dispatchEvent(new CustomEvent("inventory-updated"))
    } catch (error) {
      console.error("[v0] Error assigning item:", error)
      setError("An error occurred while assigning the item")
      toast({
        title: "Error",
        description: "An error occurred while assigning the item",
        variant: "destructive",
      })
    } finally {
      setAssignmentLoading(false)
    }
  }

  const filteredStockItems = stockItems.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category?.toLowerCase() === categoryFilter.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const uniqueCategories = [...new Set(stockItems.map(item => item.category).filter(Boolean))]

  // Handle opening edit dialog
  const handleEditAssignment = (assignment: StockAssignment) => {
    setEditingAssignment(assignment)
    setEditForm({
      assigned_to: assignment.assigned_to,
      assigned_to_email: assignment.assigned_to_email || "",
      department: assignment.department || "",
      office_location: assignment.office_location || "",
      room_number: assignment.room_number || "",
      notes: assignment.notes || "",
    })
    setEditDialogOpen(true)
  }

  // Handle saving edit
  const handleSaveEdit = async () => {
    if (!editingAssignment) return

    if (!editForm.assigned_to.trim()) {
      toast({
        title: "❌ Validation Error",
        description: "Recipient name is required",
        variant: "destructive",
      })
      return
    }

    setEditLoading(true)
    try {
      const response = await fetch("/api/store/update-assignment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: editingAssignment.id,
          assigned_to: editForm.assigned_to,
          assigned_to_email: editForm.assigned_to_email,
          department: editForm.department,
          office_location: editForm.office_location,
          room_number: editForm.room_number,
          notes: editForm.notes,
          updatedBy: user?.full_name || user?.username || user?.email,
          userRole: user?.role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast({
          title: "❌ Update Failed",
          description: result.error || "Failed to update assignment",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "✅ Assignment Updated",
        description: result.message || "Assignment has been updated successfully",
      })

      setEditDialogOpen(false)
      setEditingAssignment(null)
      loadAssignments() // Refresh the list
    } catch (error) {
      console.error("[v0] Error updating assignment:", error)
      toast({
        title: "❌ Error",
        description: "An error occurred while updating the assignment",
        variant: "destructive",
      })
    } finally {
      setEditLoading(false)
    }
  }

  const handleExportAssignments = () => {
    const headers = [
      "Date",
      "Item Name",
      "Quantity",
      "Assigned To",
      "Email",
      "Department",
      "Room Number",
      "Location",
      "Requisition #",
      "Is Replacement",
      "Replacement Reason",
      "Is Hardware",
      "Devices Created",
      "Assigned By",
      "Notes",
      "Status",
    ]

    const rows = assignments.map(a => [
      new Date(a.created_at).toLocaleDateString(),
      a.item_name,
      a.quantity,
      a.assigned_to,
      a.assigned_to_email || "",
      a.department,
      a.room_number || "",
      a.location,
      a.requisition_number || "",
      a.is_replacement ? "Yes" : "No",
      a.replacement_reason || "",
      a.is_hardware ? "Yes" : "No",
      a.devices_created,
      a.assigned_by,
      a.notes || "",
      a.status,
    ])

    downloadCSV({
      title: "Stock Assignments",
      fileName: "stock-assignments",
      headers,
      rows,
    })
  }

  if (!canAssignStock) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <p>You don't have permission to assign stock items. Only Admin, IT Store Head, and Regional IT Head can perform this action.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading stock assignment module...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Assign Stock to Staff</h2>
          <p className="text-muted-foreground">
            {user?.role === "regional_it_head" 
              ? `Assign items from your regional location (${LOCATIONS[user?.location as keyof typeof LOCATIONS] || user?.location}) stock to staff members`
              : user?.role === "it_store_head"
                ? "Assign items from Head Office stock to staff members"
                : "Assign items from all locations' stock to staff members (except Central Stores)"}
          </p>
          {user?.role !== "admin" && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Note: Central Stores items cannot be directly assigned. Use Store Requisitions to request items from Central Stores.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAssignments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportAssignments}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="assign" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assign">
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Items
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Assignment History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assign" className="space-y-4">
          {/* Info Alert about Central Stores restriction */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">Stock Assignment Policy</p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                  <li>• <strong>Regional IT Heads:</strong> Can only assign stock from their regional location inventory.</li>
                  <li>• <strong>IT Store Heads:</strong> Can only assign stock from Head Office inventory.</li>
                  <li>• <strong>Central Stores:</strong> Items cannot be directly assigned. Use <strong>Store Requisitions</strong> to request items from Central Stores.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items by name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Available Stock Items */}
          <Card>
            <CardHeader>
              <CardTitle>Available Stock Items</CardTitle>
              <CardDescription>
                Select an item to assign to a staff member. Stock will be deducted from the location's inventory.
                {user?.role === "regional_it_head" && (
                  <span className="block text-amber-600 dark:text-amber-400 mt-1">
                    You can only assign items from your regional location ({LOCATIONS[user?.location as keyof typeof LOCATIONS] || user?.location}).
                  </span>
                )}
                {user?.role === "it_store_head" && (
                  <span className="block text-amber-600 dark:text-amber-400 mt-1">
                    You can only assign items from Head Office stock.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStockItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items available for assignment</p>
                  <p className="text-sm">Items must have quantity greater than 0</p>
                  {user?.role === "regional_it_head" && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                      Check if your regional location ({LOCATIONS[user?.location as keyof typeof LOCATIONS] || user?.location}) has stock available.
                    </p>
                  )}
                  {user?.role === "it_store_head" && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                      Check if Head Office has stock available.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-center">Available</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStockItems.map((item) => {
                        const IconComponent = categoryIcons[item.category] || Package
                        return (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  {item.sku && (
                                    <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell>
                              {LOCATIONS[item.location as keyof typeof LOCATIONS] || item.location}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={item.quantity <= (item.reorder_level || 5) ? "destructive" : "secondary"}>
                                {item.quantity} {item.unit}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleAssignItem(item)}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Assign
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment History</CardTitle>
              <CardDescription>
                View all stock assignments made to staff members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No assignments recorded yet</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Req. #</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="whitespace-nowrap">
                            {new Date(assignment.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{assignment.item_name}</p>
                              {assignment.is_hardware && (
                                <p className="text-xs text-muted-foreground">
                                  {assignment.devices_created} device(s) created
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{assignment.quantity}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{assignment.assigned_to}</p>
                              {assignment.assigned_to_email && (
                                <p className="text-xs text-muted-foreground">{assignment.assigned_to_email}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>{assignment.department}</p>
                              {assignment.room_number && (
                                <p className="text-xs text-muted-foreground">Room: {assignment.room_number}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{assignment.location}</TableCell>
                          <TableCell>{assignment.requisition_number || "-"}</TableCell>
                          <TableCell>
                            {assignment.is_replacement ? (
                              <Badge variant="secondary">Replacement</Badge>
                            ) : (
                              <Badge variant="outline">New</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={assignment.status === "assigned" ? "default" : "secondary"}
                            >
                              {assignment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAssignment(assignment)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Stock Item to Staff</DialogTitle>
            <DialogDescription>
              Fill in the details below to assign {selectedItem?.name} to a staff member.
              Stock will be deducted from {selectedItem?.location} inventory.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-4">
              {/* Error/Success Messages */}
              {error && (
                <div className="bg-destructive/10 text-destructive px-4 py-2 rounded flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded flex items-center gap-2 dark:bg-green-900/20 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  {success}
                </div>
              )}

              {/* Item Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Item</Label>
                    <p className="font-medium">{selectedItem.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="font-medium">{selectedItem.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Available Stock</Label>
                    <Badge variant="secondary">{selectedItem.quantity} {selectedItem.unit}</Badge>
                  </div>
                </div>
              </div>

              {/* Staff Selection */}
              <div className="space-y-2">
                <Label>Select Staff Member *</Label>
                <Select onValueChange={handleStaffSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a staff member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} {staff.department ? `- ${staff.department}` : ""} ({staff.location || "Unknown"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Or enter details manually below if the person is not in the list
                </p>
              </div>

              {/* Manual Entry Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assigned_to_name">Recipient Name *</Label>
                  <Input
                    id="assigned_to_name"
                    placeholder="Full name of recipient"
                    value={assignmentForm.assigned_to_name}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, assigned_to_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to_email">Email Address</Label>
                  <Input
                    id="assigned_to_email"
                    type="email"
                    placeholder="Email (optional)"
                    value={assignmentForm.assigned_to_email}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, assigned_to_email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    placeholder="e.g., Finance, HR, IT"
                    value={assignmentForm.department}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room_number">Room Number</Label>
                  <Input
                    id="room_number"
                    placeholder="e.g., Room 205"
                    value={assignmentForm.room_number}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, room_number: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="requisition_number">Requisition Number</Label>
                  <Input
                    id="requisition_number"
                    placeholder="e.g., REQ-2024-001"
                    value={assignmentForm.requisition_number}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, requisition_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={selectedItem.quantity}
                    value={assignmentForm.quantity}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              {/* Replacement Section */}
              <div className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_replacement"
                    checked={assignmentForm.is_replacement}
                    onCheckedChange={(checked) => setAssignmentForm(prev => ({ ...prev, is_replacement: checked as boolean }))}
                  />
                  <Label htmlFor="is_replacement" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    This is a replacement item
                  </Label>
                </div>
                {assignmentForm.is_replacement && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="replacement_reason">Reason for Replacement *</Label>
                    <Textarea
                      id="replacement_reason"
                      placeholder="Describe why the item needs to be replaced (e.g., damaged, faulty, lost, end of life)"
                      value={assignmentForm.replacement_reason}
                      onChange={(e) => setAssignmentForm(prev => ({ ...prev, replacement_reason: e.target.value }))}
                      rows={2}
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about this assignment..."
                  value={assignmentForm.notes}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
              </div>

              {/* Hardware Notice */}
              {["Computers", "Printers", "Monitors", "Peripherals", "Hardware", "Network Equipment", "Accessories"].some(
                cat => selectedItem.category?.toLowerCase().includes(cat.toLowerCase()) ||
                       selectedItem.name.toLowerCase().includes("laptop") ||
                       selectedItem.name.toLowerCase().includes("desktop") ||
                       selectedItem.name.toLowerCase().includes("printer")
              ) && (
                <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm dark:bg-blue-900/20 dark:text-blue-400">
                  <p className="font-medium">Hardware Item Detected</p>
                  <p>A device record will be automatically created and added to the location's device inventory.</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
              disabled={assignmentLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAssignment}
              disabled={assignmentLoading}
            >
              {assignmentLoading ? "Assigning..." : "Assign Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update the assignment details. {editingAssignment?.is_hardware && "Device records will also be updated."}
            </DialogDescription>
          </DialogHeader>

          {editingAssignment && (
            <div className="space-y-4 py-4">
              {/* Item Info (read-only) */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Item</p>
                <p className="font-medium">{editingAssignment.item_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Quantity: {editingAssignment.quantity} • Location: {editingAssignment.location}
                </p>
                {editingAssignment.is_hardware && (
                  <Badge variant="secondary" className="mt-2">
                    Hardware - {editingAssignment.devices_created} device(s)
                  </Badge>
                )}
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_assigned_to">Recipient Name *</Label>
                    <Input
                      id="edit_assigned_to"
                      value={editForm.assigned_to}
                      onChange={(e) => setEditForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_email">Email</Label>
                    <Input
                      id="edit_email"
                      type="email"
                      value={editForm.assigned_to_email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, assigned_to_email: e.target.value }))}
                      placeholder="Email address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_department">Department</Label>
                    <Input
                      id="edit_department"
                      value={editForm.department}
                      onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Department"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_room">Room Number</Label>
                    <Input
                      id="edit_room"
                      value={editForm.room_number}
                      onChange={(e) => setEditForm(prev => ({ ...prev, room_number: e.target.value }))}
                      placeholder="Room number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_office_location">Office Location</Label>
                  <Input
                    id="edit_office_location"
                    value={editForm.office_location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, office_location: e.target.value }))}
                    placeholder="Office location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit_notes">Notes</Label>
                  <Textarea
                    id="edit_notes"
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>

              {editingAssignment.is_hardware && (
                <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm dark:bg-amber-900/20 dark:text-amber-400">
                  <p className="font-medium">Hardware Assignment</p>
                  <p>Updating this assignment will also update the associated device records in the device inventory.</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setEditingAssignment(null)
              }}
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={editLoading}>
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
