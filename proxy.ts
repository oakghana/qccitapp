import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

  // Get session cookie
  const session = request.cookies.get("qcc_session")

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard"]
  const isProtectedPath = protectedPaths.some((path) => request.nextUrl.pathname.startsWith(path))

  // If accessing protected path without session, redirect to login
  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If accessing login page with active session, redirect to dashboard
  if (request.nextUrl.pathname === "/" && session) {
    try {
      const userData = JSON.parse(session.value)
      let redirectUrl = "/dashboard"

      if (userData.role === "admin") {
        redirectUrl = "/dashboard/admin"
      } else if (userData.role === "it_store_head") {
        redirectUrl = "/dashboard/store-inventory"
      } else if (userData.role === "it_staff") {
        redirectUrl = "/dashboard/assigned-tasks"
      } else if (userData.role === "staff") {
        redirectUrl = "/dashboard/service-desk"
      }

      return NextResponse.redirect(new URL(redirectUrl, request.url))
    } catch {
      // Invalid session, delete it
      response.cookies.delete("qcc_session")
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
