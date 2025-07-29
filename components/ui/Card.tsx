import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'admin' | 'feature' | 'stat'
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = true, children, ...props }, ref) => {
    const baseClasses = 'bg-white border'
    
    const variantClasses = {
      default: 'shadow-soft border-gray-100 rounded-2xl p-6',
      admin: 'shadow-sm border-admin-200 rounded-lg p-6',
      feature: 'shadow-soft border-gray-100 rounded-2xl p-8 text-center',
      stat: 'bg-gradient-to-br from-white to-gray-50 shadow-soft border-gray-100 rounded-xl p-6',
    }
    
    const hoverClasses = hover ? {
      default: 'hover:shadow-medium transition-shadow duration-200',
      admin: '',
      feature: 'hover:shadow-medium hover:-translate-y-1 transition-all duration-300',
      stat: 'hover:shadow-medium transition-all duration-200',
    } : {}

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          hover && hoverClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export { Card }