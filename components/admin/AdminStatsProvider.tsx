'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRawAuth } from '@/hooks/useRawAuth'
import { getRawRequests } from '@/lib/auth-raw'

interface AdminStats {
  totalRequests: number
  newRequests: number
  myAssignedRequests: number
  completedRequests: number
  loading: boolean
  error: string | null
  refresh: () => void
}

const AdminStatsContext = createContext<AdminStats | undefined>(undefined)

export function AdminStatsProvider({ children }: { children: ReactNode }) {
  const { user, adminAccess } = useRawAuth()
  const [stats, setStats] = useState<Omit<AdminStats, 'refresh'>>({
    totalRequests: 0,
    newRequests: 0,
    myAssignedRequests: 0,
    completedRequests: 0,
    loading: true,
    error: null
  })

  const fetchStats = async () => {
    if (!user || adminAccess !== 'admin') {
      setStats(prev => ({ ...prev, loading: false }))
      return
    }

    try {
      setStats(prev => ({ ...prev, loading: true, error: null }))
      
      console.log('📊 Fetching admin stats for sidebar...')
      const requests = await getRawRequests()
      console.log('📊 Got requests for sidebar:', requests.length)
      
      const newStats = {
        totalRequests: requests.length,
        newRequests: requests.filter(r => r.status === 'pending' && !r.assigned_admin_id).length,
        myAssignedRequests: requests.filter(r => r.assigned_admin_id === user.id).length,
        completedRequests: requests.filter(r => r.status === 'completed').length,
        loading: false,
        error: null
      }
      
      console.log('📊 Sidebar stats calculated:', newStats)
      setStats(newStats)
    } catch (error) {
      console.error('Error fetching admin stats for sidebar:', error)
      setStats(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to load stats'
      }))
    }
  }

  useEffect(() => {
    if (adminAccess === 'admin') {
      fetchStats()
    }
  }, [adminAccess, user?.id])

  // Refresh stats every 30 seconds
  useEffect(() => {
    if (adminAccess === 'admin') {
      const interval = setInterval(fetchStats, 30000)
      return () => clearInterval(interval)
    }
  }, [adminAccess])

  return (
    <AdminStatsContext.Provider value={{ ...stats, refresh: fetchStats }}>
      {children}
    </AdminStatsContext.Provider>
  )
}

export function useAdminStats() {
  const context = useContext(AdminStatsContext)
  if (context === undefined) {
    throw new Error('useAdminStats must be used within an AdminStatsProvider')
  }
  return context
}