
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export type UserRole = 'CLIENT' | 'ADMIN'

export function useRoleRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (session?.user?.role === 'ADMIN') {
      // Admin should go to admin dashboard
      const currentPath = window.location.pathname
      if (currentPath === '/dashboard' || currentPath === '/') {
        router.replace('/admin/dashboard')
      }
    } else if (session?.user?.role === 'CLIENT') {
      // Client should go to client dashboard
      const currentPath = window.location.pathname
      if (currentPath.startsWith('/admin/')) {
        router.replace('/dashboard')
      }
    }
  }, [session, status, router])
}

export function useRoleAccess(requiredRole?: UserRole) {
  const { data: session } = useSession()
  
  const hasAccess = (role?: UserRole) => {
    if (!role) return true // No role requirement
    return session?.user?.role === role
  }

  const isAdmin = session?.user?.role === 'ADMIN'
  const isClient = session?.user?.role === 'CLIENT'

  return {
    hasAccess: hasAccess(requiredRole),
    isAdmin,
    isClient,
    userRole: session?.user?.role as UserRole | undefined,
  }
}

export function getRoleBasedPath(role: UserRole, path: string): string {
  if (role === 'ADMIN') {
    switch (path) {
      case 'dashboard':
        return '/admin/dashboard'
      case 'clients':
        return '/admin/clients'
      case 'analytics':
        return '/admin/analytics'
      case 'bookings':
        return '/admin/bookings'
      case 'exercises':
        return '/admin/exercises'
      default:
        return '/admin/dashboard'
    }
  } else {
    switch (path) {
      case 'dashboard':
        return '/dashboard'
      case 'schedule':
        return '/schedule'
      case 'workouts':
        return '/workouts'
      case 'exercises':
        return '/exercises'
      case 'credits':
        return '/credits'
      default:
        return '/dashboard'
    }
  }
}

export function getDefaultDashboard(role?: UserRole): string {
  return role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'
}

export function canAccessRoute(userRole: UserRole, routePath: string): boolean {
  const isAdminRoute = routePath.startsWith('/admin/')
  const isClientRoute = routePath.startsWith('/dashboard') ||
                       routePath.startsWith('/workouts') ||
                       routePath.startsWith('/credits') ||
                       routePath.startsWith('/schedule')

  if (isAdminRoute && userRole !== 'ADMIN') {
    return false
  }

  if (isClientRoute && userRole === 'ADMIN') {
    return false
  }

  return true
}

export const ADMIN_ROUTES = [
  '/admin/dashboard',
  '/admin/clients',
  '/admin/analytics',
  '/admin/bookings',
  '/admin/exercises',
]

export const CLIENT_ROUTES = [
  '/dashboard',
  '/schedule',
  '/workouts',
  '/exercises',
  '/credits',
]

export const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/auth/error',
]
