
"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { getDefaultDashboard } from '@/lib/role-utils'

interface RoleBasedRedirectProps {
  children: React.ReactNode
}

export function RoleBasedRedirect({ children }: RoleBasedRedirectProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (session?.user?.role) {
      const currentPath = window.location.pathname
      
      // Redirect from root to appropriate dashboard
      if (currentPath === '/') {
        const defaultDashboard = getDefaultDashboard(session.user.role as any)
        router.replace(defaultDashboard)
        return
      }

      // Handle role-specific redirects
      if (session.user.role === 'ADMIN') {
        // Redirect admin from client pages
        const clientPages = ['/dashboard', '/workouts', '/credits', '/schedule']
        if (clientPages.some(page => currentPath.startsWith(page))) {
          router.replace('/admin/dashboard')
          return
        }
      } else if (session.user.role === 'CLIENT') {
        // Redirect client from admin pages
        if (currentPath.startsWith('/admin/')) {
          router.replace('/dashboard')
          return
        }
      }
    }
  }, [session, status, router])

  return <>{children}</>
}
