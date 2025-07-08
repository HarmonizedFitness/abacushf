
"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoadingState, ErrorState } from '@/components/common/status-message'
import { UserRole, canAccessRoute, getDefaultDashboard } from '@/lib/role-utils'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
  fallback?: React.ReactNode
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo,
  fallback 
}: RoleGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    const userRole = session.user?.role as UserRole
    const currentPath = window.location.pathname

    // Check if user can access current route
    if (!canAccessRoute(userRole, currentPath)) {
      const defaultDashboard = getDefaultDashboard(userRole)
      router.replace(redirectTo || defaultDashboard)
      return
    }

    // Check role-specific access
    if (allowedRoles && !allowedRoles.includes(userRole)) {
      const defaultDashboard = getDefaultDashboard(userRole)
      router.replace(redirectTo || defaultDashboard)
      return
    }
  }, [session, status, router, allowedRoles, redirectTo])

  if (status === 'loading') {
    return <LoadingState message="Checking permissions..." />
  }

  if (!session) {
    return <LoadingState message="Redirecting to login..." />
  }

  const userRole = session.user?.role as UserRole
  const currentPath = window.location.pathname

  if (!canAccessRoute(userRole, currentPath)) {
    return fallback || <LoadingState message="Access denied. Redirecting..." />
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return fallback || (
      <ErrorState
        title="Access Denied"
        message="You don't have permission to access this page."
        action={
          <button
            onClick={() => router.push(getDefaultDashboard(userRole))}
            className="btn-gradient px-4 py-2 rounded-lg"
          >
            Go to Dashboard
          </button>
        }
      />
    )
  }

  return <>{children}</>
}

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  return (
    <RoleGuard allowedRoles={['ADMIN']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

interface ClientGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ClientGuard({ children, fallback }: ClientGuardProps) {
  return (
    <RoleGuard allowedRoles={['CLIENT']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}
