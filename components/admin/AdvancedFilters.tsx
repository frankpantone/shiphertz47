'use client'

import { useState, useCallback } from 'react'
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  FunnelIcon,
  CalendarIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { Card, Button, Input, Badge } from '@/components/ui'

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface DateRange {
  start: string
  end: string
}

export interface AdvancedFilters {
  search: string
  status: string[]
  dateRange: DateRange | null
  assignment: string
  customFilters: Record<string, any>
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

interface AdvancedFiltersProps {
  filters: AdvancedFilters
  onFiltersChange: (filters: AdvancedFilters) => void
  statusOptions?: FilterOption[]
  assignmentOptions?: FilterOption[]
  customFilterOptions?: Record<string, FilterOption[]>
  sortOptions?: FilterOption[]
  placeholder?: string
  className?: string
  showDateFilter?: boolean
  showSortOptions?: boolean
  resultCount?: number
  totalCount?: number
}

const DEFAULT_STATUS_OPTIONS: FilterOption[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

const DEFAULT_ASSIGNMENT_OPTIONS: FilterOption[] = [
  { value: 'assigned', label: 'Assigned' },
  { value: 'unassigned', label: 'Unassigned' }
]

const DEFAULT_SORT_OPTIONS: FilterOption[] = [
  { value: 'created_at', label: 'Date Created' },
  { value: 'order_number', label: 'Order Number' },
  { value: 'status', label: 'Status' },
  { value: 'pickup_company_name', label: 'Pickup Company' },
  { value: 'delivery_company_name', label: 'Delivery Company' }
]

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  statusOptions = DEFAULT_STATUS_OPTIONS,
  assignmentOptions = DEFAULT_ASSIGNMENT_OPTIONS,
  customFilterOptions = {},
  sortOptions = DEFAULT_SORT_OPTIONS,
  placeholder = "Search orders, VIN, company names...",
  className = "",
  showDateFilter = true,
  showSortOptions = true,
  resultCount,
  totalCount
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [dateInputType, setDateInputType] = useState<'start' | 'end' | null>(null)

  const updateFilters = useCallback((updates: Partial<AdvancedFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }, [filters, onFiltersChange])

  const handleSearchChange = (value: string) => {
    updateFilters({ search: value })
  }

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status]
    updateFilters({ status: newStatuses })
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const currentRange = filters.dateRange || { start: '', end: '' }
    const newRange = { ...currentRange, [field]: value }
    updateFilters({ dateRange: newRange.start || newRange.end ? newRange : null })
  }

  const clearAllFilters = () => {
    updateFilters({
      search: '',
      status: [],
      dateRange: null,
      assignment: '',
      customFilters: {},
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.status.length > 0) count++
    if (filters.dateRange) count++
    if (filters.assignment) count++
    count += Object.keys(filters.customFilters).length
    return count
  }

  const hasActiveFilters = getActiveFilterCount() > 0

  return (
    <Card variant="admin" className={`${className}`}>
      {/* Main Search Row */}
      <div className="p-4 border-b border-admin-200">
        <div className="flex items-center space-x-4">
          {/* Search Input */}
          <div className="flex-1">
            <Input
              variant="admin"
              placeholder={placeholder}
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              className="w-full"
            />
          </div>

          {/* Quick Status Filters */}
          <div className="flex items-center space-x-2">
            {statusOptions.slice(0, 3).map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusToggle(option.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  filters.status.includes(option.value)
                    ? 'bg-admin-600 text-white'
                    : 'bg-admin-100 text-admin-700 hover:bg-admin-200'
                }`}
              >
                {option.label}
                {option.count !== undefined && (
                  <span className="ml-1 opacity-75">({option.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Toggle Advanced Filters */}
          <Button
            variant="admin-secondary"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={hasActiveFilters ? 'ring-2 ring-admin-500' : ''}
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="admin" size="sm" className="ml-2">
                {getActiveFilterCount()}
              </Badge>
            )}
            <ChevronDownIcon 
              className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            />
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="admin-secondary"
              size="sm"
              onClick={clearAllFilters}
            >
              <XMarkIcon className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {isExpanded && (
        <div className="p-4 bg-admin-25 border-b border-admin-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* All Status Options */}
            <div>
              <label className="block text-sm font-medium text-admin-700 mb-2">
                Status
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {statusOptions.map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(option.value)}
                      onChange={() => handleStatusToggle(option.value)}
                      className="rounded border-admin-300 text-admin-600 focus:ring-admin-500"
                    />
                    <span className="ml-2 text-sm text-admin-900">
                      {option.label}
                      {option.count !== undefined && (
                        <span className="text-admin-500 ml-1">({option.count})</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Assignment Filter */}
            <div>
              <label className="block text-sm font-medium text-admin-700 mb-2">
                Assignment
              </label>
              <select
                className="w-full px-3 py-2 border border-admin-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
                value={filters.assignment}
                onChange={(e) => updateFilters({ assignment: e.target.value })}
              >
                <option value="">All Assignments</option>
                {assignmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                    {option.count !== undefined && ` (${option.count})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            {showDateFilter && (
              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Date Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-admin-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-admin-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
                    placeholder="End date"
                  />
                </div>
              </div>
            )}

            {/* Sort Options */}
            {showSortOptions && (
              <div>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  Sort By
                </label>
                <div className="space-y-2">
                  <select
                    className="w-full px-3 py-2 border border-admin-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
                    value={filters.sortBy}
                    onChange={(e) => updateFilters({ sortBy: e.target.value })}
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className="w-full px-3 py-2 border border-admin-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
                    value={filters.sortOrder}
                    onChange={(e) => updateFilters({ sortOrder: e.target.value as 'asc' | 'desc' })}
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            )}

            {/* Custom Filters */}
            {Object.entries(customFilterOptions).map(([key, options]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-admin-700 mb-2">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-admin-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
                  value={filters.customFilters[key] || ''}
                  onChange={(e) => updateFilters({ 
                    customFilters: { 
                      ...filters.customFilters, 
                      [key]: e.target.value || undefined 
                    } 
                  })}
                >
                  <option value="">All {key.replace('_', ' ')}</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                      {option.count !== undefined && ` (${option.count})`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="px-4 py-3 bg-admin-50 border-t border-admin-200">
        <div className="flex items-center justify-between text-sm text-admin-600">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-4 w-4" />
            <span>
              {resultCount !== undefined && totalCount !== undefined
                ? `Showing ${resultCount} of ${totalCount} results`
                : 'Filters applied'
              }
            </span>
          </div>
          
          {hasActiveFilters && (
            <div className="flex items-center space-x-2">
              <span>Active filters:</span>
              <div className="flex flex-wrap gap-1">
                {filters.search && (
                  <Badge variant="admin" size="sm">
                    Search: "{filters.search}"
                  </Badge>
                )}
                {filters.status.map(status => (
                  <Badge key={status} variant="admin" size="sm">
                    {statusOptions.find(s => s.value === status)?.label || status}
                  </Badge>
                ))}
                {filters.assignment && (
                  <Badge variant="admin" size="sm">
                    {assignmentOptions.find(a => a.value === filters.assignment)?.label || filters.assignment}
                  </Badge>
                )}
                {filters.dateRange && (
                  <Badge variant="admin" size="sm">
                    {filters.dateRange.start} to {filters.dateRange.end}
                  </Badge>
                )}
                {Object.entries(filters.customFilters).map(([key, value]) => (
                  <Badge key={key} variant="admin" size="sm">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}