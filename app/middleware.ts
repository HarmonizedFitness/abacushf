
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') || 
                      req.nextUrl.pathname.startsWith('/signup')
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin')
    const isAPIRoute = req.nextUrl.pathname.startsWith('/api')

    // Allow public routes
    if (req.nextUrl.pathname === '/' || 
        req.nextUrl.pathname.startsWith('/auth/') ||
        req.nextUrl.pathname.startsWith('/_next/') ||
        req.nextUrl.pathname.startsWith('/favicon')) {
      return NextResponse.next()
    }

    // Handle API routes separately
    if (isAPIRoute) {
      // Public API routes
      if (req.nextUrl.pathname.startsWith('/api/auth/')) {
        return NextResponse.next()
      }
      
      // Protected API routes require authentication
      if (!isAuth) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Authentication required' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        )
      }

      // Admin API routes require admin role
      if (req.nextUrl.pathname.startsWith('/api/admin/') && token?.role !== 'ADMIN') {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Admin access required' }),
          { status: 403, headers: { 'content-type': 'application/json' } }
        )
      }

      return NextResponse.next()
    }

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Redirect unauthenticated users to login
    if (!isAuthPage && !isAuth) {
      let from = req.nextUrl.pathname
      if (req.nextUrl.search) {
        from += req.nextUrl.search
      }

      return NextResponse.redirect(
        new URL(`/login?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    // Admin page access control
    if (isAdminPage && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Redirect admin users away from client pages
    const isClientOnlyPage = req.nextUrl.pathname.startsWith('/dashboard') ||
                            req.nextUrl.pathname.startsWith('/workouts') ||
                            req.nextUrl.pathname.startsWith('/credits') ||
                            req.nextUrl.pathname.startsWith('/schedule')
    
    if (isClientOnlyPage && token?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // Let middleware handle authorization logic
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
