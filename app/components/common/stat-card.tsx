
import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  className?: string
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  className 
}: StatCardProps) {
  return (
    <Card className={cn('bg-hf-card border-hf-card hover:border-hf-orange/30 transition-all duration-300', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-hf-text-secondary">
          {title}
        </CardTitle>
        {Icon && (
          <div className="w-8 h-8 bg-gradient-orange rounded-lg flex items-center justify-center">
            <Icon className="h-4 w-4 text-white" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-hf-text mb-1 animate-count-up">
          {value}
        </div>
        {description && (
          <p className="text-xs text-hf-text-secondary">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={cn(
                'text-xs font-medium',
                trend.isPositive !== false ? 'text-hf-success' : 'text-hf-error'
              )}
            >
              {trend.isPositive !== false ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-hf-text-secondary ml-1">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface MetricCardProps {
  label: string
  value: string | number
  subValue?: string
  icon?: LucideIcon
  color?: 'orange' | 'blue' | 'green' | 'purple'
  className?: string
}

export function MetricCard({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  color = 'orange',
  className 
}: MetricCardProps) {
  const colorClasses = {
    orange: 'bg-gradient-orange',
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    green: 'bg-gradient-to-r from-green-500 to-green-600',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
  }

  return (
    <div className={cn('p-6 rounded-lg bg-hf-card border border-hf-card hover:border-hf-orange/30 transition-all duration-300', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-hf-text-secondary text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-hf-text mt-1">{value}</p>
          {subValue && (
            <p className="text-hf-text-secondary text-xs mt-1">{subValue}</p>
          )}
        </div>
        {Icon && (
          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colorClasses[color])}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
      </div>
    </div>
  )
}
