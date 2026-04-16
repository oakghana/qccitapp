"use client"

import { ArrowDownAZ, ArrowUpDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SortControlsProps {
  sortField: string
  sortDirection: "asc" | "desc"
  onSortFieldChange: (value: string) => void
  onSortDirectionChange: (value: "asc" | "desc") => void
  options: Array<{ value: string; label: string }>
}

export function SortControls({
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
  options,
}: SortControlsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select value={sortField} onValueChange={onSortFieldChange}>
        <SelectTrigger className="w-full sm:w-44">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sortDirection} onValueChange={(value) => onSortDirectionChange(value as "asc" | "desc")}>
        <SelectTrigger className="w-full sm:w-36">
          <ArrowDownAZ className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Ascending</SelectItem>
          <SelectItem value="desc">Descending</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
