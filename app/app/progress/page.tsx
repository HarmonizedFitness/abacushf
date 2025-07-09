
"use client"

import { useSession } from 'next-auth/react'
import { ProtectedLayout } from '@/components/layout/protected-layout'
import { ProgressDashboard } from '@/components/progress/progress-dashboard'
import { LoadingState } from '@/components/common/status-message'

export default function ClientProgressPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <ProtectedLayout>
        <LoadingState message="Loading progress dashboard..." />
      </ProtectedLayout>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <ProtectedLayout>
      <ProgressDashboard 
        userId={session.user.id}
        readonly={true}
        showHeader={true}
      />
    </ProtectedLayout>
  )
}
