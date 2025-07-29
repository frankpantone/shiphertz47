import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'pending' | 'quoted' | 'accepted' | 'completed' | 'cancelled' | 'admin' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'admin', size = 'md', children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center font-medium rounded-full'
    
    const variantClasses = {
      pending: 'bg-warning-100 text-warning-800',
      quoted: 'bg-trust-100 text-trust-800',
      accepted: 'bg-primary-100 text-primary-800',
      completed: 'bg-success-100 text-success-800',
      cancelled: 'bg-red-100 text-red-800',
      admin: 'bg-admin-100 text-admin-800',
      success: 'bg-success-100 text-success-800',
      warning: 'bg-warning-100 text-warning-800',
      danger: 'bg-red-100 text-red-800',
    }
    
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-xs',
      lg: 'px-4 py-1.5 text-sm',
    }

    return (
      <span
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }