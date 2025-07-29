'use client'

import { useState } from 'react'
import { 
  BellIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { Button, Badge } from '@/components/ui'

export default function AdminHeader() {
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  return (
    <header className="bg-white border-b border-admin-200 h-16">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-admin-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders, customers, or VINs..."
              className="block w-full pl-10 pr-3 py-2 border border-admin-300 rounded-lg text-sm placeholder-admin-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          {/* Quick Stats */}
          <div className="hidden lg:flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-admin-900">247</div>
              <div className="text-admin-600">Active Orders</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-success-600">98.5%</div>
              <div className="text-admin-600">On-Time Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-primary-600">$2.4M</div>
              <div className="text-admin-600">Monthly Revenue</div>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-admin-600 hover:text-admin-900 hover:bg-admin-100 rounded-lg transition-colors">
              <BellIcon className="h-6 w-6" />
              <Badge 
                variant="danger" 
                size="sm" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </button>
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-2 text-admin-600 hover:text-admin-900 hover:bg-admin-100 rounded-lg transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">A</span>
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-admin-900">Admin User</div>
                <div className="text-xs text-admin-600">System Administrator</div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-admin-200 py-1 z-50">
                <a
                  href="/admin/profile"
                  className="flex items-center px-4 py-2 text-sm text-admin-700 hover:bg-admin-100"
                >
                  <UserCircleIcon className="h-4 w-4 mr-3" />
                  Profile Settings
                </a>
                <a
                  href="/admin/settings"
                  className="flex items-center px-4 py-2 text-sm text-admin-700 hover:bg-admin-100"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-3" />
                  System Settings
                </a>
                <hr className="my-1 border-admin-200" />
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}