
"use client"

import { ReactNode } from 'react'
import { HomeButton } from './home-button'
import { BackButton } from './back-button'
import { Breadcrumbs } from './breadcrumbs'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  children?: ReactNode
  showHome?: boolean
  showBack?: boolean
  backHref?: string
  backLabel?: string
  showBreadcrumbs?: boolean
  breadcrumbItems?: Array<{
    label: string
    href?: string
    current?: boolean
  }>
  className?: string
}

export function PageHeader({
  title,
  description,
  children,
  showHome = true,
  showBack = false,
  backHref,
  backLabel,
  showBreadcrumbs = true,
  breadcrumbItems,
  className
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Navigation Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {showBack && (
            <BackButton 
              href={backHref}
              label={backLabel}
            />
          )}
          {showHome && !showBack && (
            <HomeButton />
          )}
        </div>
        
        {showBreadcrumbs && (
          <Breadcrumbs items={breadcrumbItems} />
        )}
      </div>

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-hf-text">{title}</h1>
          {description && (
            <p className="text-hf-text-secondary">{description}</p>
          )}
        </div>
        
        {children && (
          <div className="flex items-center space-x-2">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
