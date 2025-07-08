
"use client"

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  if (!session) return null

  const isAdmin = session.user?.role === 'ADMIN'
  const homeUrl = isAdmin ? '/admin/dashboard' : '/dashboard'
  const homeLabel = isAdmin ? 'Admin' : 'Dashboard'

  // Auto-generate breadcrumbs if not provided
  const breadcrumbItems = items || generateBreadcrumbs(pathname, isAdmin)

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center space-x-1 text-sm", className)}>
      <Link 
        href={homeUrl}
        className="flex items-center text-hf-text-secondary hover:text-hf-text transition-colors"
      >
        <Home className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">{homeLabel}</span>
      </Link>
      
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1 text-hf-text-secondary" />
          {item.href && !item.current ? (
            <Link 
              href={item.href}
              className="text-hf-text-secondary hover:text-hf-text transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              item.current ? "text-hf-text font-medium" : "text-hf-text-secondary"
            )}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

function generateBreadcrumbs(pathname: string, isAdmin: boolean): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Skip the first segment if it's 'admin'
  const startIndex = isAdmin && segments[0] === 'admin' ? 1 : 0

  for (let i = startIndex; i < segments.length; i++) {
    const segment = segments[i]
    const isLast = i === segments.length - 1
    
    // Generate href for non-last items
    const href = isLast ? undefined : `/${segments.slice(0, i + 1).join('/')}`
    
    // Generate label
    const label = formatSegmentLabel(segment, segments, i)
    
    breadcrumbs.push({
      label,
      href,
      current: isLast
    })
  }

  return breadcrumbs
}

function formatSegmentLabel(segment: string, segments: string[], index: number): string {
  // Handle dynamic routes (like [id])
  if (segment.startsWith('[') && segment.endsWith(']')) {
    return 'Details'
  }

  // Special cases
  const specialCases: Record<string, string> = {
    'dashboard': 'Dashboard',
    'clients': 'Clients',
    'workouts': 'Workouts',
    'exercises': 'Exercises',
    'analytics': 'Analytics',
    'bookings': 'Schedule',
    'schedule': 'Schedule',
    'credits': 'Credits',
    'personal-records': 'Personal Records',
    'new': 'New',
    'edit': 'Edit'
  }

  if (specialCases[segment]) {
    return specialCases[segment]
  }

  // Capitalize first letter and replace hyphens with spaces
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
}
