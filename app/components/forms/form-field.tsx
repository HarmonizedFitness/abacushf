
"use client"

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select'
  placeholder?: string
  value?: string | number
  onChange?: (value: string) => void
  onBlur?: () => void
  error?: string
  required?: boolean
  disabled?: boolean
  options?: Array<{ value: string; label: string }>
  rows?: number
  className?: string
  inputClassName?: string
}

export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  value = '',
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  options = [],
  rows = 3,
  className,
  inputClassName,
}: FormFieldProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange?.(e.target.value)
  }

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            id={name}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onBlur={onBlur}
            disabled={disabled}
            rows={rows}
            className={cn(
              'input-focus',
              error && 'border-hf-error focus:border-hf-error focus:ring-hf-error',
              inputClassName
            )}
          />
        )

      case 'select':
        return (
          <Select
            value={value?.toString() || 'all'}
            onValueChange={(val) => onChange?.(val === 'all' ? '' : val)}
            disabled={disabled}
          >
            <SelectTrigger
              className={cn(
                'input-focus',
                error && 'border-hf-error focus:border-hf-error focus:ring-hf-error',
                inputClassName
              )}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {placeholder && (
                <SelectItem value="all">{placeholder}</SelectItem>
              )}
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      default:
        return (
          <Input
            id={name}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onBlur={onBlur}
            disabled={disabled}
            className={cn(
              'input-focus',
              error && 'border-hf-error focus:border-hf-error focus:ring-hf-error',
              inputClassName
            )}
          />
        )
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="text-hf-text">
        {label}
        {required && <span className="text-hf-error ml-1">*</span>}
      </Label>
      {renderInput()}
      {error && (
        <p className="text-sm text-hf-error">{error}</p>
      )}
    </div>
  )
}

interface FormRowProps {
  children: React.ReactNode
  className?: string
}

export function FormRow({ children, className }: FormRowProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', className)}>
      {children}
    </div>
  )
}

interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {title && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-hf-text">{title}</h3>
          {description && (
            <p className="text-sm text-hf-text-secondary">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
