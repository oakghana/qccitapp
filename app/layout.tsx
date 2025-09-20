import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/lib/auth-context"
import { NotificationProvider } from "@/lib/notification-context"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "QCC IT Device Tracker",
  description: "Quality Control Company Limited - IT Device Management and Repair Tracking System",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["QCC", "IT", "Device Management", "Repair Tracking", "Quality Control"],
  authors: [
    {
      name: "QCC IT Department",
    },
  ],
  icons: {
    icon: "/images/qcc-logo.png",
    shortcut: "/images/qcc-logo.png",
    apple: "/images/qcc-logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "QCC IT Tracker",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "QCC IT Device Tracker",
    title: "QCC IT Device Tracker",
    description: "Quality Control Company Limited - IT Device Management and Repair Tracking System",
  },
  twitter: {
    card: "summary",
    title: "QCC IT Device Tracker",
    description: "Quality Control Company Limited - IT Device Management and Repair Tracking System",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="QCC IT Tracker" />
        <link rel="apple-touch-icon" href="/images/qcc-logo.png" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <NotificationProvider>
              <Suspense fallback={null}>{children}</Suspense>
              <Toaster 
                position="top-right"
                expand={true}
                richColors
                closeButton
                toastOptions={{
                  style: {
                    background: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  },
                }}
              />
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
