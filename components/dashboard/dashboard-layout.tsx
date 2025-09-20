"use client"

import type React from "react"
import { ModernLayout } from "@/components/layout/modern-layout"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ModernLayout>
      {children}
    </ModernLayout>
  )
}
