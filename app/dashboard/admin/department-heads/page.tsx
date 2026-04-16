"use client"

import { DepartmentHeadLinking } from "@/components/admin/department-head-linking"

export default function DepartmentHeadsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Department Heads Management</h1>
          <p className="text-muted-foreground mt-2">
            Assign department head roles and link staff members to their department heads
          </p>
        </div>
        <DepartmentHeadLinking />
      </div>
    </div>
  )
}
