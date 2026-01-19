"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
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
import { Plus } from "lucide-react"

interface Category {
  id: string
  name: string
  description?: string
}

interface CategorySelectorProps {
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
  onCategoryNameChange?: (categoryName: string) => void
}

export function CategorySelector({ selectedCategory, onCategoryChange, onCategoryNameChange }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategoryOpen, setNewCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDesc, setNewCategoryDesc] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/store/categories")
      const result = await response.json()

      if (result.success) {
        setCategories(result.categories || [])
      }
    } catch (error) {
      console.error("[v0] Error loading categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      alert("Category name is required")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/store/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc,
          createdBy: "system",
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`Error: ${result.error}`)
        return
      }

      // Add new category to list
      setCategories([...categories, result.category])

      // Set as selected
      onCategoryChange(result.category.id)
      if (onCategoryNameChange) {
        onCategoryNameChange(result.category.name)
      }

      // Reset form
      setNewCategoryName("")
      setNewCategoryDesc("")
      setNewCategoryOpen(false)
    } catch (error) {
      console.error("[v0] Error creating category:", error)
      alert("Failed to create category")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-3">
      <Label>Category</Label>
      <div className="flex gap-2">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" title="Add new category">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>Create a new stock category for central store items</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Category Name *</Label>
                <Input
                  id="cat-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Consumables, Hardware, Software"
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-desc">Description (Optional)</Label>
                <Input
                  id="cat-desc"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Brief description of this category"
                  disabled={isCreating}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setNewCategoryOpen(false)
                  setNewCategoryName("")
                  setNewCategoryDesc("")
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCategory} disabled={isCreating || !newCategoryName.trim()}>
                {isCreating ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
