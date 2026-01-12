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
  Users,
  Wrench,
  Headphones,
  BarChart3,
  FileText,
  Shield,
  TrendingUp,
  Package,
} from "lucide-react"
import Link from "next/link"

export default function HelpGuidePage() {
  const [activeGuide, setActiveGuide] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const guides = [
    {
      id: "add-user",
      title: "Add New User",
      icon: Users,
      description: "Register new staff members in the system",
      color: "blue",
      category: "users",
      steps: [
        "Navigate to Users page from the admin sidebar",
        'Click "Add User" button',
        "Enter user details (name, email, username)",
        "Select user role (Admin, IT Staff, Regional IT Head, etc.)",
        "Choose user location",
        "Set initial password (users should change on first login)",
        'Click "Create User" to save',
      ],
      permissions: "Admin Only",
      link: "/dashboard/admin",
      tip: "Always use strong passwords and ensure users change them on first login. Regional IT Heads should only manage users in their location.",
    },
    {
      id: "manage-users",
      title: "Edit User Details",
      icon: Users,
      description: "Update user information and permissions",
      color: "blue",
      category: "users",
      steps: [
        "Go to Users page",
        "Search or filter to find the user",
        'Click "Edit" button next to the user',
        "Update user details (name, role, location, status)",
        "Save changes",
        "User will be notified of any role or permission changes",
      ],
      permissions: "Admin, IT Store Head (non-admin users only)",
      link: "/dashboard/admin",
      tip: "IT Store Head can view users but cannot edit or delete admin accounts. Always verify changes before saving.",
    },
    {
      id: "approve-users",
      title: "Approve User Registrations",
      icon: CheckCircle2,
      description: "Review and approve pending user accounts",
      color: "green",
      category: "users",
      steps: [
        "Navigate to Pending User Approvals",
        "Review user registration details",
        "Verify user email and department",
        "Click Approve to activate account",
        "Or click Reject with reason if not valid",
        "User receives email notification of approval status",
      ],
      permissions: "Admin Only",
      link: "/dashboard/admin",
      tip: "Always verify the user's department and email domain before approving. Rejected users can resubmit with corrections.",
    },
    {
      id: "add-device",
      title: "Add New Device",
      icon: MonitorSmartphone,
      description: "Register new IT equipment in the system",
      color: "purple",
      category: "devices",
      steps: [
        "Navigate to Devices page from the sidebar",
        'Click "Add New Device" button',
        "Fill in device details (type, brand, model, serial number)",
        "Select device location",
        "Assign to user (optional)",
        "Set warranty information and purchase date",
        'Click "Add Device" to save',
      ],
      permissions: "IT Staff, Regional IT Head, IT Head, Admin",
      link: "/dashboard/devices",
      tip: "Always verify serial numbers to avoid duplicates. You can search existing devices before adding new ones.",
    },
    {
      id: "edit-device",
      title: "Edit Device Information",
      icon: MonitorSmartphone,
      description: "Update device details and assignments",
      color: "purple",
      category: "devices",
      steps: [
        "Go to Devices page",
        "Search or filter to find the device",
        'Click "Edit" button',
        "Update device information (status, location, assignment)",
        "Save changes",
        "View audit log for device history",
      ],
      permissions: "IT Staff, Regional IT Head, IT Head, Admin",
      link: "/dashboard/devices",
      tip: "Device edits are logged in the audit trail. Always update status when transferring devices.",
    },
    {
      id: "transfer-device",
      title: "Transfer Device",
      icon: ArrowRight,
      description: "Move device to another location or user",
      color: "purple",
      category: "devices",
      steps: [
        "Open device details",
        'Click "Transfer Device" button',
        "Select destination location",
        "Assign to new user (optional)",
        "Add transfer notes",
        "Confirm transfer",
        "Transfer history is recorded",
      ],
      permissions: "IT Staff, Regional IT Head, IT Head, Admin",
      link: "/dashboard/devices",
      tip: "Transfer records help track device movement across locations and ensure accountability.",
    },
    {
      id: "create-repair",
      title: "Create Repair Request",
      icon: Wrench,
      description: "Log device repairs and maintenance",
      color: "orange",
      category: "repairs",
      steps: [
        "Navigate to Repairs page",
        'Click "New Repair Request"',
        "Select device from dropdown or enter details",
        "Describe the issue in detail",
        "Set priority level (Low, Medium, High, Urgent)",
        "Add estimated cost if known",
        "Submit repair request",
      ],
      permissions: "IT Staff at Head Office, Admin",
      link: "/dashboard/repairs",
      tip: "Only IT Staff at Head Office and Admin can create repair requests. Be specific in issue descriptions for faster resolution.",
    },
    {
      id: "assign-repair",
      title: "Assign Repair Task",
      icon: Wrench,
      description: "Assign repairs to IT staff members",
      color: "orange",
      category: "repairs",
      steps: [
        "Go to Repairs page",
        "View pending repair requests",
        'Click "Assign" button',
        "Select IT staff member from dropdown",
        "Set due date",
        "Add assignment notes",
        "Confirm assignment",
      ],
      permissions: "IT Head, Regional IT Head, Admin",
      link: "/dashboard/repairs",
      tip: "Consider staff workload and location when assigning repairs. Regional IT Heads can only assign repairs in their location.",
    },
    {
      id: "update-repair",
      title: "Update Repair Status",
      icon: CheckCircle2,
      description: "Track repair progress and completion",
      color: "green",
      category: "repairs",
      steps: [
        "Open assigned repair task",
        'Click "Update Status"',
        "Change status (In Progress, Completed, On Hold)",
        "Add progress notes or resolution details",
        "Upload photos or documents if needed",
        "Save update",
      ],
      permissions: "Assigned IT Staff, IT Head, Admin",
      link: "/dashboard/assigned-tasks",
      tip: "Regular status updates help track repair progress. Add detailed notes when completing repairs for future reference.",
    },
    {
      id: "submit-ticket",
      title: "Submit Service Desk Ticket",
      icon: Headphones,
      description: "Request IT support or report issues",
      color: "cyan",
      category: "service-desk",
      steps: [
        "Navigate to Service Desk",
        'Click "New Ticket" or "Submit Request"',
        "Select issue category (Hardware, Software, Network, etc.)",
        "Enter subject and detailed description",
        "Set priority if applicable",
        "Attach screenshots or files if needed",
        "Submit ticket",
      ],
      permissions: "All Users",
      link: "/dashboard/service-desk",
      tip: "Include as much detail as possible for faster resolution. You can track ticket status from your dashboard.",
    },
    {
      id: "manage-ticket",
      title: "Manage Service Tickets",
      icon: Headphones,
      description: "Assign and resolve support tickets",
      color: "cyan",
      category: "service-desk",
      steps: [
        "Go to Service Desk dashboard",
        "View pending tickets",
        "Click ticket to view details",
        "Assign to IT staff member or take ownership",
        "Update status and add resolution notes",
        "Close ticket when resolved",
      ],
      permissions: "IT Staff, IT Head, Admin",
      link: "/dashboard/service-desk",
      tip: "Respond to tickets quickly to maintain good service levels. Keep users updated on progress.",
    },
    {
      id: "add-inventory",
      title: "Add Store Inventory",
      icon: PackagePlus,
      description: "Add new items to the IT store",
      color: "emerald",
      category: "inventory",
      steps: [
        "Navigate to Store Inventory page",
        'Click "Add New Item" button',
        "Enter item name and select category",
        "Input SKU and SIV number",
        "Set quantity and reorder level",
        "Choose location (Head Office, regional offices, or Central Stores)",
        "Add supplier information",
        'Click "Add Item" to save',
      ],
      permissions: "IT Head, IT Store Head, Admin",
      link: "/dashboard/store-inventory",
      tip: "Items in Central Stores are visible to all IT staff but can only be transferred by Admin or IT Store Head to Head Office.",
    },
    {
      id: "edit-stock",
      title: "Edit Stock Levels",
      icon: Package,
      description: "Update inventory quantities and details",
      color: "emerald",
      category: "inventory",
      steps: [
        "Go to Store Inventory or Store Overview",
        "Click on stock item card",
        'Click "Edit Stock" button',
        "Update quantity and reorder level",
        "Save changes with reason (logged in audit)",
        "View updated stock levels",
      ],
      permissions: "IT Head, IT Store Head, Admin",
      link: "/dashboard/store-inventory",
      tip: "All stock edits are logged for audit purposes. Set reorder levels carefully to get automatic alerts.",
    },
    {
      id: "transfer-central",
      title: "Transfer from Central Stores",
      icon: ArrowRight,
      description: "Move items from Central Stores to Head Office",
      color: "emerald",
      category: "inventory",
      steps: [
        "Navigate to Store Overview or Inventory",
        "Select Central Stores item",
        'Click "Transfer to Head Office"',
        "Enter quantity to transfer",
        "Add transfer notes",
        "Confirm transfer",
        "Quantity reduces in Central Stores, increases in Head Office",
      ],
      permissions: "IT Store Head, Admin Only",
      link: "/dashboard/store-overview",
      tip: "Only Admin and IT Store Head can transfer from Central Stores. This action is permanently logged in audit trail.",
    },
    {
      id: "make-requisition",
      title: "Make a Requisition",
      icon: ClipboardList,
      description: "Request items from the IT store",
      color: "indigo",
      category: "requisitions",
      steps: [
        "Go to Store Requisitions page",
        'Click "New Requisition" button',
        "Enter beneficiary name and select location",
        "Add items from available stock (excluding Central Stores)",
        "Specify quantity needed for each item",
        "Add notes or special requirements",
        "Submit requisition for approval",
      ],
      permissions: "All IT Staff, Regional IT Head",
      link: "/dashboard/store-requisitions",
      tip: "Central Stores items cannot be requisitioned - they are for reference only. Check stock availability before submitting.",
    },
    {
      id: "approve-requisition",
      title: "Approve Requisitions",
      icon: CheckCircle2,
      description: "Review and approve stock requests",
      color: "indigo",
      category: "requisitions",
      steps: [
        "Navigate to Store Requisitions",
        "View pending requisitions",
        "Review requested items and quantities",
        "Check stock availability",
        "Approve or reject with comments",
        "Approved items can then be issued",
      ],
      permissions: "IT Store Head, Admin",
      link: "/dashboard/store-requisitions",
      tip: "Verify stock levels before approving. You can partially approve requisitions if full quantity is not available.",
    },
    {
      id: "issue-items",
      title: "Issue Requisition Items",
      icon: Package,
      description: "Release approved items to beneficiaries",
      color: "indigo",
      category: "requisitions",
      steps: [
        "Go to approved requisitions",
        'Click "Issue Items" button',
        "Verify beneficiary details",
        "Confirm quantities being issued",
        "Complete issuance",
        "Stock levels automatically reduce",
        "Requisition marked as completed",
      ],
      permissions: "IT Store Head, Admin",
      link: "/dashboard/store-requisitions",
      tip: "Issued items are automatically deducted from inventory. This action is logged in the store summary report.",
    },
    {
      id: "generate-reports",
      title: "Generate IT Reports",
      icon: FileText,
      description: "Create comprehensive IT reports",
      color: "amber",
      category: "reports",
      steps: [
        "Navigate to IT Reports page",
        "Select report type (Overview, Devices, Repairs, Service Desk)",
        "Choose location filter (All or specific location)",
        "Select date range (Last 30 days, 90 days, custom)",
        'Click "Generate Report"',
        "View report data and charts",
        "Export as PDF or CSV if needed",
      ],
      permissions: "IT Head, IT Store Head, Regional IT Head, Admin",
      link: "/dashboard/it-reports",
      tip: "Regional IT Heads only see reports for their location. Use filters to get specific insights.",
    },
    {
      id: "view-analytics",
      title: "View Analytics Dashboard",
      icon: BarChart3,
      description: "Monitor system metrics and trends",
      color: "amber",
      category: "reports",
      steps: [
        "Go to Analytics page",
        "View key metrics (repairs, tickets, costs)",
        "Check performance by location",
        "Analyze trends over time",
        "Review device breakdown charts",
        "Export data for further analysis",
      ],
      permissions: "IT Head, IT Store Head, Regional IT Head, Admin",
      link: "/dashboard/analytics",
      tip: "Use analytics to identify trends and make data-driven decisions. All data comes from live database.",
    },
    {
      id: "store-summary",
      title: "Store Summary Report",
      icon: TrendingUp,
      description: "View comprehensive inventory analysis",
      color: "amber",
      category: "reports",
      steps: [
        "Navigate to Store Summary Report",
        "View total inventory value",
        "Check items requiring reorder",
        "See low stock and out of stock items",
        "Review quantity removed this month",
        "Check previous month balance",
        'Click "Export Report" for Excel or PDF',
      ],
      permissions: "IT Store Head, Admin",
      link: "/dashboard/store-summary-report",
      tip: "This report shows actual quantities issued from requisitions. Use it for procurement planning.",
    },
    {
      id: "view-audit",
      title: "View Audit Logs",
      icon: Shield,
      description: "Monitor all system activities",
      color: "red",
      category: "security",
      steps: [
        "Go to Admin dashboard",
        'Click "Audit" tab',
        "View all user activities and system events",
        "Filter by user, action, or date",
        "Search for specific activities",
        "Export audit trail for compliance",
      ],
      permissions: "Admin Only",
      link: "/dashboard/admin",
      tip: "Audit logs capture all critical actions including user edits, stock changes, and transfers. Logs cannot be deleted.",
    },
  ]

  const categories = [
    { id: "all", label: "All Guides", icon: FileText },
    { id: "users", label: "User Management", icon: Users },
    { id: "devices", label: "Device Management", icon: MonitorSmartphone },
    { id: "repairs", label: "Repairs", icon: Wrench },
    { id: "service-desk", label: "Service Desk", icon: Headphones },
    { id: "inventory", label: "Store Inventory", icon: PackagePlus },
    { id: "requisitions", label: "Requisitions", icon: ClipboardList },
    { id: "reports", label: "Reports & Analytics", icon: BarChart3 },
    { id: "security", label: "Security & Audit", icon: Shield },
  ]

  const filteredGuides = selectedCategory === "all" ? guides : guides.filter((g) => g.category === selectedCategory)

  const handlePrint = () => {
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
          @page {
            margin: 1.5cm;
            size: A4;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12 no-print">
            <Badge variant="outline" className="mb-4">
              Complete Training Manual
            </Badge>
            <h1 className="text-4xl font-bold mb-4 text-balance">QCC IT System Guide</h1>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Comprehensive step-by-step instructions for all tasks in the IT Management System
            </p>

            <div className="flex gap-3 justify-center mt-6">
              <Button onClick={handlePrint} variant="outline">
                <Printer className="w-4 h-4 mr-2" />
                Print Complete Guide
              </Button>
              <Button onClick={handlePrint}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8 no-print">
            {categories.map((cat) => {
              const Icon = cat.icon
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {cat.label}
                </Button>
              )
            })}
          </div>

          {/* Print Version */}
          <div className="hidden print:block">
            <div className="text-center mb-8 border-b-2 pb-6">
              <h1 className="text-3xl font-bold mb-2">QCC IT Management System</h1>
              <h2 className="text-2xl font-semibold text-primary mb-2">Complete Administrator Training Manual</h2>
              <p className="text-sm text-muted-foreground">Quality Control Company Limited</p>
              <p className="text-xs text-muted-foreground mt-2">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            {guides.map((guide, index) => {
              const Icon = guide.icon
              return (
                <div key={guide.id} className={`mb-8 ${index < guides.length - 1 ? "print-page-break" : ""}`}>
                  <div className="border-2 border-primary/20 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b-2">
                      <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold">{guide.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{guide.description}</p>
                      </div>
                    </div>

                    <div className="mb-4 pb-4 border-b">
                      <p className="text-xs font-bold text-muted-foreground mb-2">REQUIRED PERMISSIONS:</p>
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        {guide.permissions}
                      </Badge>
                    </div>

                    <div className="space-y-3 mb-6">
                      <p className="font-bold text-sm text-primary">STEP-BY-STEP INSTRUCTIONS:</p>
                      {guide.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex gap-3 items-start">
                          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-bold">
                            {stepIndex + 1}
                          </div>
                          <p className="text-sm pt-1 leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                      <p className="text-xs font-bold mb-2">💡 QUICK TIP</p>
                      <p className="text-xs leading-relaxed">{guide.tip}</p>
                    </div>
                  </div>
                </div>
              )
            })}

            <div className="text-center text-xs text-muted-foreground mt-12 pt-6 border-t-2">
              <p className="mb-2">For additional support, contact IT Department at QCC Head Office</p>
              <p className="font-semibold">
                © {new Date().getFullYear()} Quality Control Company Limited - All Rights Reserved
              </p>
            </div>
          </div>

          {/* Interactive Version */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 no-print">
            {filteredGuides.map((guide) => {
              const Icon = guide.icon
              const isActive = activeGuide === guide.id

              return (
                <Card
                  key={guide.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                    isActive ? "ring-2 ring-primary shadow-xl" : ""
                  }`}
                  onClick={() => setActiveGuide(isActive ? null : guide.id)}
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="flex-1">{guide.title}</span>
                      <ChevronRight
                        className={`w-5 h-5 transition-transform flex-shrink-0 ${isActive ? "rotate-90" : ""}`}
                      />
                    </CardTitle>
                    <CardDescription className="text-sm">{guide.description}</CardDescription>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {guide.category}
                    </Badge>
                  </CardHeader>
                </Card>
              )
            })}
          </div>

          {/* Detailed Steps for Selected Guide */}
          {activeGuide && (
            <Card className="mb-8 animate-in fade-in-50 slide-in-from-bottom-4 no-print">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {(() => {
                      const guide = guides.find((g) => g.id === activeGuide)
                      const Icon = guide?.icon
                      return Icon ? (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-8 h-8 text-primary" />
                        </div>
                      ) : null
                    })()}
                    <div>
                      <CardTitle className="text-2xl mb-2">{guides.find((g) => g.id === activeGuide)?.title}</CardTitle>
                      <CardDescription className="text-base">
                        {guides.find((g) => g.id === activeGuide)?.description}
                      </CardDescription>
                      <Badge variant="secondary" className="mt-3">
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
                <h3 className="font-semibold text-lg mb-4">Step-by-Step Instructions:</h3>
                <div className="space-y-4">
                  {guides
                    .find((g) => g.id === activeGuide)
                    ?.steps.map((step, index) => (
                      <div
                        key={index}
                        className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold">{index + 1}</span>
                        </div>
                        <p className="text-muted-foreground pt-1.5">{step}</p>
                      </div>
                    ))}
                </div>

                <div className="mt-8 p-5 bg-primary/5 border-l-4 border-primary rounded-lg">
                  <div className="flex gap-3 items-start">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-2">Quick Tip</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {guides.find((g) => g.id === activeGuide)?.tip}
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
              <CardDescription>Additional resources and support options available to administrators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                  <h4 className="font-semibold mb-2">System Status</h4>
                  <p className="text-sm text-muted-foreground mb-3">Check system health and uptime</p>
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
                <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                  <h4 className="font-semibold mb-2">Video Tutorials</h4>
                  <p className="text-sm text-muted-foreground mb-3">Watch detailed video guides for each feature</p>
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                </div>
                <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                  <h4 className="font-semibold mb-2">Contact IT Support</h4>
                  <p className="text-sm text-muted-foreground mb-3">Reach out for technical assistance</p>
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
