'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  UserGroupIcon,
  EyeIcon,
  ChartBarIcon,
  CogIcon,
  TruckIcon,
  DocumentTextIcon,
  UsersIcon,
  CreditCardIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { useAdminStats } from './AdminStatsProvider'

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: number
  children?: NavItem[]
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: HomeIcon,
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ClipboardDocumentListIcon,
    children: [
      {
        name: 'New Orders',
        href: '/admin/orders/new',
        icon: PlusIcon,
      },
      {
        name: 'Assigned to Me',
        href: '/admin/orders/assigned',
        icon: UserGroupIcon,
      },
      {
        name: 'All Orders',
        href: '/admin/orders/all',
        icon: EyeIcon,
      }
    ]
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: ChartBarIcon,
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: UsersIcon,
  },
  {
    name: 'Quotes',
    href: '/admin/quotes',
    icon: DocumentTextIcon,
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: CreditCardIcon,
  },
  {
    name: 'Fleet',
    href: '/admin/fleet',
    icon: TruckIcon,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: CogIcon,
  }
]

export default function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()
  const { newRequests, myAssignedRequests, loading } = useAdminStats()

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  const isChildActive = (children: NavItem[]) => {
    return children.some(child => pathname.startsWith(child.href))
  }

  const getBadgeCount = (href: string) => {
    if (loading) return undefined
    
    switch (href) {
      case '/admin/orders/new':
        return newRequests > 0 ? newRequests : undefined
      case '/admin/orders/assigned':
        return myAssignedRequests > 0 ? myAssignedRequests : undefined
      default:
        return undefined
    }
  }

  return (
    <div className={cn(
      "flex flex-col bg-admin-800 text-admin-100 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 bg-admin-900">
        {!collapsed && (
          <div className="flex items-center">
            <TruckIcon className="h-8 w-8 text-primary-400" />
            <span className="ml-2 text-lg font-bold text-white">
              ShipHertz
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-admin-700 transition-colors"
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <div key={item.name}>
            {item.children ? (
              <>
                <button
                  onClick={() => toggleExpanded(item.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isChildActive(item.children)
                      ? "bg-admin-700 text-white"
                      : "hover:bg-admin-700 hover:text-white"
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronRightIcon 
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expandedItems.includes(item.name) && "transform rotate-90"
                      )} 
                    />
                  )}
                </button>
                
                {!collapsed && expandedItems.includes(item.name) && (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
                          isActive(child.href)
                            ? "bg-primary-600 text-white"
                            : "hover:bg-admin-700 hover:text-white"
                        )}
                      >
                        <div className="flex items-center">
                          <child.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                          <span>{child.name}</span>
                        </div>
                        {getBadgeCount(child.href) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {getBadgeCount(child.href)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive(item.href)
                    ? "bg-primary-600 text-white"
                    : "hover:bg-admin-700 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {item.badge}
                  </span>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-admin-700">
        {!collapsed ? (
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">A</span>
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Admin User
              </p>
              <p className="text-xs text-admin-300 truncate">
                admin@shiphertz.com
              </p>
            </div>
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center mx-auto">
            <span className="text-sm font-medium text-white">A</span>
          </div>
        )}
      </div>
    </div>
  )
}