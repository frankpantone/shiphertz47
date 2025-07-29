import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: 'primary' | 'secondary' | 'trust' | 'admin-primary' | 'admin-secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, asChild = false, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variantClasses = {
      primary: 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white shadow-soft hover:shadow-medium focus:ring-primary-500 transform hover:-translate-y-0.5',
      secondary: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-soft hover:shadow-medium focus:ring-primary-500 transform hover:-translate-y-0.5',
      trust: 'bg-gradient-to-r from-trust-600 to-trust-700 hover:from-trust-700 hover:to-trust-800 text-white shadow-soft hover:shadow-medium focus:ring-trust-500 transform hover:-translate-y-0.5',
      'admin-primary': 'bg-admin-600 hover:bg-admin-700 text-white focus:ring-admin-500',
      'admin-secondary': 'bg-admin-100 hover:bg-admin-200 text-admin-700 focus:ring-admin-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      success: 'bg-success-600 hover:bg-success-700 text-white focus:ring-success-500',
    }
    
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm rounded-lg',
      md: 'px-4 py-2.5 text-sm rounded-lg',
      lg: 'px-6 py-3 text-base rounded-xl',
    }
    
    // Customer variants get larger sizes and rounded corners
    const isCustomerVariant = ['primary', 'secondary', 'trust'].includes(variant)
    const customerSizeClasses = {
      sm: 'px-4 py-2.5 text-sm rounded-xl',
      md: 'px-5 py-3 text-base rounded-xl', 
      lg: 'px-8 py-4 text-lg rounded-xl',
    }
    
    const finalSizeClasses = isCustomerVariant ? customerSizeClasses[size] : sizeClasses[size]
    
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          finalSizeClasses,
          loading && 'cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {icon && !loading && <span className="mr-2">{icon}</span>}
        {children}
      </Comp>
    )
  }
)

Button.displayName = 'Button'

export { Button }