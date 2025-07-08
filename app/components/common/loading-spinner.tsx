
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div
      className={cn(
        'border-2 border-hf-card border-t-hf-orange rounded-full animate-spin',
        sizeClasses[size],
        className
      )}
    />
  )
}

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-hf-text-secondary text-sm">{message}</p>
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 bg-hf-dark/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-hf-card p-8 rounded-lg shadow-lg">
        <LoadingState message="Loading..." />
      </div>
    </div>
  )
}
