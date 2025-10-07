"use client"

import { ModernLayout } from "@/components/layout/modern-layout"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ModernLayout>{children}</ModernLayout>
}