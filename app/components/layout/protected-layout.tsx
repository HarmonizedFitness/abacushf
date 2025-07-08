
"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Header } from '@/components/navigation/header'
import { LoadingState } from '@/components/common/loading-spinner'

interface ProtectedLayoutProps {
  children: React.ReactNode
  requireRole?: 'CLIENT' | 'ADMIN'
}

export function ProtectedLayout({ children, requireRole }: ProtectedLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/login')
      return
    }

    if (requireRole && session.user?.role !== requireRole) {
      router.push('/dashboard')
      return
    }
  }, [session, status, router, requireRole])

  if (status === 'loading') {
    return <LoadingState message="Loading..." />
  }

  if (!session) {
    return <LoadingState message="Redirecting to login..." />
  }

  if (requireRole && session.user?.role !== requireRole) {
    return <LoadingState message="Access denied. Redirecting..." />
  }

  return (
    <div className="min-h-screen bg-hf-dark">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
    </div>
  )
}
