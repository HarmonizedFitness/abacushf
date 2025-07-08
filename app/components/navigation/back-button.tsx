
"use client"

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BackButtonProps {
  href?: string
  label?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg'
}

export function BackButton({ 
  href, 
  label = 'Back', 
  className, 
  variant = 'ghost', 
  size = 'sm' 
}: BackButtonProps) {
  const router = useRouter()

  if (href) {
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
        <Link href={href}>
          <ArrowLeft className="h-4 w-4" />
          {label}
        </Link>
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "flex items-center gap-2",
        className
      )}
      onClick={() => router.back()}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}
