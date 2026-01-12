"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  PackagePlus,
  ClipboardList,
  MonitorSmartphone,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Printer,
  Download,
} from "lucide-react"
import Link from "next/link"

export default function HelpGuidePage() {
  const [activeGuide, setActiveGuide] = useState<string | null>(null)

  const guides = [
    {
      id: "add-device",
      title: "Add a Device",
      icon: MonitorSmartphone,
      description: "Register new IT equipment in the system",
      color: "blue",
      steps: [
        "Navigate to Devices page from the sidebar",
        'Click "Add New Device" button',
        "Fill in device details (type, brand, model, serial number)",
        "Select device location and assign to user (optional)",
        "Set warranty information and purchase date",
        'Click "Add Device" to save',
      ],
      permissions: "IT Staff, Regional IT Head, IT Head, Admin",
      link: "/dashboard/devices",
    },
    {
      id: "make-requisition",
      title: "Make a Requisition",
      icon: ClipboardList,
      description: "Request items from the IT store",
      color: "green",
      steps: [
        "Go to Store Requisitions page",
        'Click "New Requisition" button',
        "Enter beneficiary name and select location",
        "Add items by selecting from available stock",
        "Specify quantity needed for each item",
        "Add any notes or special requirements",
        "Submit requisition for approval",
      ],
      permissions: "All IT Staff, Regional IT Head",
      link: "/dashboard/store-requisitions",
    },
    {
      id: "add-inventory",
      title: "Add Store Inventory",
      icon: PackagePlus,
      description: "Add new items to the IT store",
      color: "purple",
      steps: [
        "Navigate to Store Inventory page",
        'Click "Add New Item" button',
        "Enter item name and select category",
        "Input SKU and SIV number",
        "Set quantity and reorder level",
        "Choose item location (or Central Stores for all-access)",
        "Add supplier information",
        'Click "Add Item" to save',
      ],
      permissions: "IT Head, IT Store Head, Admin",
      link: "/dashboard/store-inventory",
    },
  ]

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    window.print()
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-page-break {
            page-break-after: always;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Quick Start Guide
            </Badge>
            <h1 className="text-4xl font-bold mb-4 text-balance">How to Use the System</h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Step-by-step instructions for common tasks in the QCC IT Management System
            </p>

            <div className="flex gap-3 justify-center mt-6 no-print">
              <Button onClick={handlePrint} variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print Guide
              </Button>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="hidden print:block mb-8">
            <div className="text-center mb-8 border-b pb-6">
              <h1 className="text-3xl font-bold mb-2">QCC IT Management System</h1>
              <h2 className="text-xl font-semibold text-primary mb-2">Quick Reference Guide</h2>
              <p className="text-sm text-muted-foreground">Quality Control Company Limited</p>
            </div>

            {guides.map((guide, index) => {
              const Icon = guide.icon
              return (
                <div key={guide.id} className={`mb-8 ${index < guides.length - 1 ? "print-page-break" : ""}`}>
                  <div className="border-2 border-primary/20 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{guide.title}</h3>
                        <p className="text-sm text-muted-foreground">{guide.description}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">WHO CAN DO THIS:</p>
                      <Badge variant="secondary">{guide.permissions}</Badge>
                    </div>

                    <div className="space-y-3">
                      <p className="font-semibold text-sm">STEP-BY-STEP INSTRUCTIONS:</p>
                      {guide.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            {stepIndex + 1}
                          </div>
                          <p className="text-sm pt-0.5">{step}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-3 bg-muted rounded border-l-4 border-primary">
                      <p className="text-xs font-semibold mb-1">💡 QUICK TIP</p>
                      <p className="text-xs">
                        {guide.id === "add-device" &&
                          "Always verify serial numbers to avoid duplicates. You can also bulk import devices using CSV files."}
                        {guide.id === "make-requisition" &&
                          "Check available stock levels before making requisitions. Items at Central Stores are visible to all locations."}
                        {guide.id === "add-inventory" &&
                          "Set reorder levels carefully to ensure automatic alerts when stock runs low. Items added to Central Stores are visible to all IT staff."}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="text-center text-xs text-muted-foreground mt-8 pt-4 border-t">
              <p>For additional support, visit the Service Desk or contact IT Support</p>
              <p className="mt-1">© {new Date().getFullYear()} Quality Control Company Limited</p>
            </div>
          </div>

          {/* Guide Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12 no-print">
            {guides.map((guide) => {
              const Icon = guide.icon
              const isActive = activeGuide === guide.id

              return (
                <Card
                  key={guide.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${isActive ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setActiveGuide(isActive ? null : guide.id)}
                >
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-lg bg-${guide.color}-500/10 flex items-center justify-center mb-4`}
                    >
                      <Icon className={`w-6 h-6 text-${guide.color}-600`} />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {guide.title}
                      <ChevronRight className={`w-5 h-5 transition-transform ${isActive ? "rotate-90" : ""}`} />
                    </CardTitle>
                    <CardDescription>{guide.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>

          {/* Detailed Steps */}
          {activeGuide && (
            <Card className="mb-8 animate-in fade-in-50 slide-in-from-bottom-4 no-print">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {(() => {
                      const guide = guides.find((g) => g.id === activeGuide)
                      const Icon = guide?.icon
                      return Icon ? (
                        <div
                          className={`w-16 h-16 rounded-lg bg-${guide.color}-500/10 flex items-center justify-center`}
                        >
                          <Icon className={`w-8 h-8 text-${guide.color}-600`} />
                        </div>
                      ) : null
                    })()}
                    <div>
                      <CardTitle className="text-2xl mb-2">{guides.find((g) => g.id === activeGuide)?.title}</CardTitle>
                      <CardDescription>{guides.find((g) => g.id === activeGuide)?.description}</CardDescription>
                      <Badge variant="secondary" className="mt-2">
                        {guides.find((g) => g.id === activeGuide)?.permissions}
                      </Badge>
                    </div>
                  </div>
                  <Link href={guides.find((g) => g.id === activeGuide)?.link || "#"}>
                    <Button>
                      Go to Page
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-4">Step-by-Step Instructions:</h3>
                <div className="space-y-4">
                  {guides
                    .find((g) => g.id === activeGuide)
                    ?.steps.map((step, index) => (
                      <div key={index} className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">{index + 1}</span>
                        </div>
                        <p className="text-muted-foreground pt-1">{step}</p>
                      </div>
                    ))}
                </div>

                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <div className="flex gap-2 items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium mb-1">Quick Tip</p>
                      <p className="text-sm text-muted-foreground">
                        {activeGuide === "add-device" &&
                          "Always verify serial numbers to avoid duplicates. You can also bulk import devices using CSV files."}
                        {activeGuide === "make-requisition" &&
                          "Check available stock levels before making requisitions. Items at Central Stores are visible to all locations."}
                        {activeGuide === "add-inventory" &&
                          "Set reorder levels carefully to ensure automatic alerts when stock runs low. Items added to Central Stores are visible to all IT staff."}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Resources */}
          <Card className="no-print">
            <CardHeader>
              <CardTitle>Need More Help?</CardTitle>
              <CardDescription>Additional resources and support options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Video Tutorials</h4>
                  <p className="text-sm text-muted-foreground mb-3">Watch detailed video guides for each feature</p>
                  <Button variant="outline" size="sm">
                    Coming Soon
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Contact Support</h4>
                  <p className="text-sm text-muted-foreground mb-3">Reach out to IT support for assistance</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/service-desk">Open Ticket</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
