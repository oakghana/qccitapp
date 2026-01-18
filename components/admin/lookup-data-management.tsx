"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type LookupType = "locations" | "departments" | "device_types" | "item_categories" | "regions" | "districts"

interface LookupItem {
  id: any
  code: string
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
  region_id?: string
}

const LOOKUP_TYPES: Record<LookupType, { label: string; description: string }> = {
  locations: { label: "Locations", description: "Manage office and regional locations" },
  departments: { label: "Departments", description: "Manage organizational departments" },
  device_types: { label: "Device Types", description: "Manage device categories" },
  item_categories: { label: "Item Categories", description: "Manage store item categories" },
  regions: { label: "Regions", description: "Manage regions for locations and districts" },
  districts: { label: "Districts", description: "Manage districts and link them to regions" },
}

export function LookupDataManagement() {
  const [selectedType, setSelectedType] = useState<LookupType>("locations")
  const [items, setItems] = useState<LookupItem[]>([])
  const [regions, setRegions] = useState<LookupItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<LookupItem | null>(null)
  const [formData, setFormData] = useState({ code: "", name: "", is_active: true, region_id: "" })
  const { toast } = useToast()

  useEffect(() => {
    fetchItems()
  }, [selectedType])

  useEffect(() => {
    // preload regions for district linking
    const loadRegions = async () => {
      try {
        const res = await fetch(`/api/admin/lookup-data?type=regions`)
        if (res.ok) {
          const data = await res.json()
          setRegions(data || [])
        }
      } catch (e) {
        console.error("Failed to preload regions", e)
      }
    }
    loadRegions()
  }, [])

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/lookup-data?type=${selectedType}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch lookup data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingItem
        ? `/api/admin/lookup-data?type=${selectedType}&id=${editingItem.id}`
        : `/api/admin/lookup-data?type=${selectedType}`

      const res = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: editingItem ? "Item updated successfully" : "Item created successfully",
        })
        setShowDialog(false)
        setEditingItem(null)
        setFormData({ code: "", name: "", is_active: true, region_id: "" })
        fetchItems()
        // refresh regions so districts list stays in sync
        try {
          const r = await fetch(`/api/admin/lookup-data?type=regions`)
          if (r.ok) setRegions(await r.json())
        } catch (e) {
          /* ignore */
        }
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save item",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const res = await fetch(`/api/admin/lookup-data?type=${selectedType}&id=${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: "Item deleted successfully",
        })
        fetchItems()
        try {
          const r = await fetch(`/api/admin/lookup-data?type=regions`)
          if (r.ok) setRegions(await r.json())
        } catch (e) {
          /* ignore */
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      })
    }
  }

  const openDialog = (item?: LookupItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        code: item.code,
        name: item.name,
        is_active: item.is_active,
        region_id: (item as any).region_id || "",
      })
    } else {
      setEditingItem(null)
      setFormData({ code: "", name: "", is_active: true, region_id: "" })
    }
    setShowDialog(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Lookup Data Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage system reference data and dropdown values</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(LOOKUP_TYPES).map(([key, { label, description }]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedType === key ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => setSelectedType(key as LookupType)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{label}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {items.length > 0 && selectedType === key ? items.length : "•••"}
              </div>
              <p className="text-xs text-muted-foreground">Total items</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{LOOKUP_TYPES[selectedType].label}</CardTitle>
              <CardDescription>{LOOKUP_TYPES[selectedType].description}</CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No items found. Click "Add New" to create one.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  {selectedType === "districts" && <TableHead>Region</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.code}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    {selectedType === "districts" && (
                      <TableCell>
                        {regions.find((r) => String(r.id) === String(item.region_id))?.name || "-"}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "secondary"}>
                        {item.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit" : "Add"} {LOOKUP_TYPES[selectedType].label}
            </DialogTitle>
            <DialogDescription>{editingItem ? "Update" : "Create a new"} lookup item</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., head_office"
                required
                disabled={!!editingItem}
              />
              <p className="text-xs text-muted-foreground mt-1">Unique identifier (lowercase, underscores only)</p>
            </div>
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Head Office"
                required
              />
            </div>
            {selectedType === "districts" && (
              <div>
                <Label htmlFor="region">Region *</Label>
                <select
                  id="region"
                  value={formData.region_id}
                  onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}
                  className="w-full border rounded px-2 py-1"
                  required
                >
                  <option value="">-- Select Region --</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active (visible in dropdowns)
              </Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingItem ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
