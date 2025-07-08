
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title?: string
  message: string
  className?: string
}

export function StatusMessage({ type, title, message, className }: StatusMessageProps) {
  const config = {
    success: {
      icon: CheckCircle,
      className: 'bg-hf-success/10 border-hf-success/20 text-hf-success',
      iconClassName: 'text-hf-success',
    },
    error: {
      icon: XCircle,
      className: 'bg-hf-error/10 border-hf-error/20 text-hf-error',
      iconClassName: 'text-hf-error',
    },
    warning: {
      icon: AlertCircle,
      className: 'bg-hf-orange/10 border-hf-orange/20 text-hf-orange',
      iconClassName: 'text-hf-orange',
    },
    info: {
      icon: Info,
      className: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      iconClassName: 'text-blue-400',
    },
  }

  const { icon: Icon, className: baseClassName, iconClassName } = config[type]

  return (
    <div className={cn('flex items-start space-x-3 p-4 rounded-lg border', baseClassName, className)}>
      <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconClassName)} />
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-sm font-medium mb-1">{title}</h3>
        )}
        <p className="text-sm opacity-90">{message}</p>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function LoadingState({ message = 'Loading...', className }: { message?: string; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="w-8 h-8 border-2 border-hf-card border-t-hf-orange rounded-full animate-spin mb-4" />
      <p className="text-hf-text-secondary text-sm">{message}</p>
    </div>
  )
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {Icon && (
        <div className="w-12 h-12 bg-hf-card rounded-lg flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-hf-text-secondary" />
        </div>
      )}
      <h3 className="text-lg font-medium text-hf-text mb-2">{title}</h3>
      {description && (
        <p className="text-hf-text-secondary mb-6 max-w-md">{description}</p>
      )}
      {action}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message: string
  action?: React.ReactNode
  className?: string
}

export function ErrorState({ 
  title = 'Something went wrong', 
  message, 
  action, 
  className 
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="w-12 h-12 bg-hf-error/10 rounded-lg flex items-center justify-center mb-4">
        <XCircle className="h-6 w-6 text-hf-error" />
      </div>
      <h3 className="text-lg font-medium text-hf-text mb-2">{title}</h3>
      <p className="text-hf-text-secondary mb-6 max-w-md">{message}</p>
      {action}
    </div>
  )
}
