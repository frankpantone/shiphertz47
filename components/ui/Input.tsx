import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'admin'
  error?: string
  label?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', error, label, icon, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
    
    const baseClasses = 'block w-full border placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200'
    
    const variantClasses = {
      default: 'px-4 py-3 rounded-xl shadow-soft focus:ring-primary-500 focus:border-primary-500',
      admin: 'px-3 py-2 rounded-lg shadow-sm focus:ring-admin-500 focus:border-admin-500',
    }
    
    const stateClasses = error 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300'

    return (
      <div className="space-y-1">
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              'block text-sm font-semibold mb-2',
              variant === 'admin' ? 'text-admin-700 font-medium mb-1' : 'text-gray-700'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              baseClasses,
              variantClasses[variant],
              stateClasses,
              icon && 'pl-10',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }