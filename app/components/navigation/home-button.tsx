
"use client"

import { useSession } from 'next-auth/react'
import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface HomeButtonProps {
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg'
}

export function HomeButton({ className, variant = 'ghost', size = 'sm' }: HomeButtonProps) {
  const { data: session } = useSession()
  
  if (!session) return null

  const isAdmin = session.user?.role === 'ADMIN'
  const homeUrl = isAdmin ? '/admin/dashboard' : '/dashboard'
  const label = isAdmin ? 'Admin Dashboard' : 'Dashboard'

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn(
        "flex items-center gap-2",
        className
      )}
    >
      <Link href={homeUrl}>
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">Home</span>
      </Link>
    </Button>
  )
}
