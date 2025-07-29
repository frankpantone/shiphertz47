'use client'

import { useEffect, useState } from 'react'
import { useRawAuth } from '@/hooks/useRawAuth'
import { toast } from 'react-hot-toast'
import { 
  Cog6ToothIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  TruckIcon,
  MapPinIcon,
  EnvelopeIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Card, Button, Badge, Input } from '@/components/ui'

interface SystemSettings {
  companyName: string
  companyEmail: string
  companyPhone: string
  defaultQuoteValidityDays: number
  autoAssignOrders: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  requireApprovalForQuotes: boolean
  maxVehiclesPerOrder: number
  defaultInsuranceCoverage: number
}

interface UserProfile {
  fullName: string
  email: string
  role: string
  phone?: string
  department?: string
  lastLogin?: string
}

export default function SettingsPage() {
  const { user, profile, adminAccess, redirectToLogin, redirectToDashboard } = useRawAuth()
  const [activeTab, setActiveTab] = useState('company')
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>({
    companyName: 'ShipHertz Auto Logistics',
    companyEmail: 'admin@shiphertz.com',
    companyPhone: '1-800-SHIP-CAR',
    defaultQuoteValidityDays: 7,
    autoAssignOrders: false,
    emailNotifications: true,
    smsNotifications: false,
    requireApprovalForQuotes: true,
    maxVehiclesPerOrder: 10,
    defaultInsuranceCoverage: 100000
  })
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    fullName: 'Admin User',
    email: 'admin@shiphertz.com',
    role: 'System Administrator',
    phone: '+1 (555) 123-4567',
    department: 'Operations',
    lastLogin: new Date().toISOString()
  })

  useEffect(() => {
    if (adminAccess === 'not-authenticated') {
      redirectToLogin()
      return
    }
    
    if (adminAccess === 'not-admin') {
      redirectToDashboard()
      return
    }
    
    if (adminAccess === 'admin') {
      loadSettings()
    }
  }, [adminAccess])

  const loadSettings = async () => {
    // In a real app, load from API/database
    console.log('Loading settings...')
  }

  const saveSettings = async () => {
    try {
      setLoading(true)
      // In a real app, save to API/database
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleProfileChange = (key: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (adminAccess === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        <div className="ml-4">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (adminAccess !== 'admin') {
    return null
  }

  const tabs = [
    { id: 'company', name: 'Company Settings', icon: Cog6ToothIcon },
    { id: 'profile', name: 'User Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'system', name: 'System', icon: TruckIcon }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-900">Settings</h1>
          <p className="text-admin-600 mt-1">Manage system configuration and preferences</p>
        </div>
        <Button 
          variant="admin-primary" 
          onClick={saveSettings}
          loading={loading}
        >
          Save Changes
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card variant="admin" className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-admin-600 text-white'
                      : 'text-admin-700 hover:bg-admin-100'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Company Settings */}
          {activeTab === 'company' && (
            <Card variant="admin" className="p-6">
              <div className="flex items-center mb-6">
                <Cog6ToothIcon className="h-6 w-6 text-admin-600 mr-3" />
                <h2 className="text-xl font-semibold text-admin-900">Company Information</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  variant="admin"
                  label="Company Name"
                  value={settings.companyName}
                  onChange={(e) => handleSettingChange('companyName', e.target.value)}
                />
                
                <Input
                  variant="admin"
                  label="Company Email"
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => handleSettingChange('companyEmail', e.target.value)}
                  icon={<EnvelopeIcon className="h-4 w-4" />}
                />
                
                <Input
                  variant="admin"
                  label="Company Phone"
                  value={settings.companyPhone}
                  onChange={(e) => handleSettingChange('companyPhone', e.target.value)}
                />
                
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-2">
                    Default Quote Validity (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.defaultQuoteValidityDays}
                    onChange={(e) => handleSettingChange('defaultQuoteValidityDays', parseInt(e.target.value))}
                    className="px-3 py-2 border border-admin-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500 focus:border-admin-500 w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-2">
                    Max Vehicles Per Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxVehiclesPerOrder}
                    onChange={(e) => handleSettingChange('maxVehiclesPerOrder', parseInt(e.target.value))}
                    className="px-3 py-2 border border-admin-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500 focus:border-admin-500 w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-2">
                    Default Insurance Coverage ($)
                  </label>
                  <input
                    type="number"
                    min="50000"
                    max="2000000"
                    step="10000"
                    value={settings.defaultInsuranceCoverage}
                    onChange={(e) => handleSettingChange('defaultInsuranceCoverage', parseInt(e.target.value))}
                    className="px-3 py-2 border border-admin-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500 focus:border-admin-500 w-full"
                  />
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-admin-900">Auto-Assign Orders</h3>
                    <p className="text-sm text-admin-600">Automatically assign new orders to available admins</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoAssignOrders}
                      onChange={(e) => handleSettingChange('autoAssignOrders', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-admin-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-admin-900">Require Approval for Quotes</h3>
                    <p className="text-sm text-admin-600">All quotes must be approved before sending to customers</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireApprovalForQuotes}
                      onChange={(e) => handleSettingChange('requireApprovalForQuotes', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-admin-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                  </label>
                </div>
              </div>
            </Card>
          )}

          {/* User Profile */}
          {activeTab === 'profile' && (
            <Card variant="admin" className="p-6">
              <div className="flex items-center mb-6">
                <UserIcon className="h-6 w-6 text-admin-600 mr-3" />
                <h2 className="text-xl font-semibold text-admin-900">User Profile</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  variant="admin"
                  label="Full Name"
                  value={userProfile.fullName}
                  onChange={(e) => handleProfileChange('fullName', e.target.value)}
                />
                
                <Input
                  variant="admin"
                  label="Email Address"
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  icon={<EnvelopeIcon className="h-4 w-4" />}
                />
                
                <Input
                  variant="admin"
                  label="Phone Number"
                  value={userProfile.phone || ''}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                />
                
                <Input
                  variant="admin"
                  label="Department"
                  value={userProfile.department || ''}
                  onChange={(e) => handleProfileChange('department', e.target.value)}
                />
                
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-2">Role</label>
                  <Badge variant="admin" size="md">{userProfile.role}</Badge>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-admin-700 mb-2">Last Login</label>
                  <p className="text-sm text-admin-600">
                    {userProfile.lastLogin ? new Date(userProfile.lastLogin).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <Card variant="admin" className="p-6">
              <div className="flex items-center mb-6">
                <BellIcon className="h-6 w-6 text-admin-600 mr-3" />
                <h2 className="text-xl font-semibold text-admin-900">Notification Preferences</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-admin-900">Email Notifications</h3>
                    <p className="text-sm text-admin-600">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-admin-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-admin-900">SMS Notifications</h3>
                    <p className="text-sm text-admin-600">Receive notifications via text message</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-admin-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                  </label>
                </div>
                
                <div className="bg-admin-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-admin-900 mb-3">Notification Types</h4>
                  <div className="space-y-2 text-sm text-admin-700">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-success-500 mr-2" />
                      New order submissions
                    </div>
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-success-500 mr-2" />
                      Quote approvals required
                    </div>
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-success-500 mr-2" />
                      Payment confirmations
                    </div>
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-success-500 mr-2" />
                      System alerts
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <Card variant="admin" className="p-6">
                <div className="flex items-center mb-6">
                  <ShieldCheckIcon className="h-6 w-6 text-admin-600 mr-3" />
                  <h2 className="text-xl font-semibold text-admin-900">Security Settings</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-admin-900 mb-3">Change Password</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input
                        variant="admin"
                        label="Current Password"
                        type="password"
                        icon={<KeyIcon className="h-4 w-4" />}
                      />
                      <Input
                        variant="admin"
                        label="New Password"
                        type="password"
                        icon={<KeyIcon className="h-4 w-4" />}
                      />
                    </div>
                    <Button variant="admin-secondary" className="mt-3">
                      Update Password
                    </Button>
                  </div>
                  
                  <div className="border-t border-admin-200 pt-6">
                    <h3 className="text-sm font-medium text-admin-900 mb-3">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-4 bg-admin-50 rounded-lg">
                      <div className="flex items-start">
                        <ShieldCheckIcon className="h-5 w-5 text-success-500 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-admin-900">2FA Enabled</p>
                          <p className="text-sm text-admin-600">Your account is protected with two-factor authentication</p>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">Active</Badge>
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card variant="admin" className="p-6">
                <div className="flex items-center mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-warning-600 mr-3" />
                  <h3 className="text-lg font-semibold text-admin-900">Danger Zone</h3>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-900 mb-2">Reset System Data</h4>
                  <p className="text-sm text-red-700 mb-4">
                    This will permanently delete all orders, quotes, and customer data. This action cannot be undone.
                  </p>
                  <Button variant="danger" size="sm">
                    Reset All Data
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* System */}
          {activeTab === 'system' && (
            <Card variant="admin" className="p-6">
              <div className="flex items-center mb-6">
                <TruckIcon className="h-6 w-6 text-admin-600 mr-3" />
                <h2 className="text-xl font-semibold text-admin-900">System Information</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-admin-900">Application Version</h3>
                    <p className="text-sm text-admin-600">v2.1.0</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-admin-900">Database Status</h3>
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-success-500 mr-2" />
                      <span className="text-sm text-success-600">Connected</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-admin-900">Payment Gateway</h3>
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-4 w-4 text-success-500 mr-2" />
                      <span className="text-sm text-success-600">Stripe Connected</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-admin-900">Last Backup</h3>
                    <p className="text-sm text-admin-600">2 hours ago</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-admin-900">Uptime</h3>
                    <p className="text-sm text-admin-600">99.9% (30 days)</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-admin-900">Storage Used</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 h-2 bg-admin-200 rounded-full">
                        <div className="h-2 bg-primary-500 rounded-full" style={{ width: '35%' }}></div>
                      </div>
                      <span className="text-sm text-admin-600">3.5GB / 10GB</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-admin-200">
                <div className="flex items-center space-x-4">
                  <Button variant="admin-secondary">
                    Download Logs
                  </Button>
                  <Button variant="admin-secondary">
                    Export Data
                  </Button>
                  <Button variant="admin-secondary">
                    System Backup
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}