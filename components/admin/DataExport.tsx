'use client'

import { useState } from 'react'
import { 
  DocumentArrowDownIcon, 
  XMarkIcon,
  CheckIcon,
  ChartBarIcon,
  TableCellsIcon,
  DocumentTextIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { Card, Button, Badge } from '@/components/ui'
import { toast } from 'react-hot-toast'

export interface ExportData {
  id: string
  order_number: string
  status: string
  pickup_company_name: string
  pickup_company_address: string
  pickup_contact_name: string
  pickup_contact_phone: string
  delivery_company_name: string
  delivery_company_address: string
  delivery_contact_name: string
  delivery_contact_phone: string
  vin_number: string
  vehicle_make?: string
  vehicle_model?: string
  vehicle_year?: number
  assigned_admin_id?: string
  assigned_admin_name?: string
  created_at: string
  updated_at?: string
  total_amount?: number
  notes?: string
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf' | 'json'
  includeFields: string[]
  dateRange?: {
    start: string
    end: string
  }
  filters?: {
    status?: string[]
    assignment?: string
  }
}

interface DataExportProps {
  data: ExportData[]
  isOpen: boolean
  onClose: () => void
  filename?: string
  title?: string
}

const EXPORT_FORMATS = [
  {
    value: 'csv',
    label: 'CSV',
    description: 'Comma-separated values - Excel compatible',
    icon: TableCellsIcon,
    mimeType: 'text/csv'
  },
  {
    value: 'xlsx',
    label: 'Excel',
    description: 'Microsoft Excel spreadsheet',
    icon: ChartBarIcon,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Portable Document Format',
    icon: DocumentTextIcon,
    mimeType: 'application/pdf'
  },
  {
    value: 'json',
    label: 'JSON',
    description: 'JavaScript Object Notation - Developer friendly',
    icon: DocumentArrowDownIcon,
    mimeType: 'application/json'
  }
] as const

const AVAILABLE_FIELDS = [
  { key: 'order_number', label: 'Order Number', required: true },
  { key: 'status', label: 'Status', required: true },
  { key: 'created_at', label: 'Created Date', required: true },
  { key: 'pickup_company_name', label: 'Pickup Company' },
  { key: 'pickup_company_address', label: 'Pickup Address' },
  { key: 'pickup_contact_name', label: 'Pickup Contact' },
  { key: 'pickup_contact_phone', label: 'Pickup Phone' },
  { key: 'delivery_company_name', label: 'Delivery Company' },
  { key: 'delivery_company_address', label: 'Delivery Address' },
  { key: 'delivery_contact_name', label: 'Delivery Contact' },
  { key: 'delivery_contact_phone', label: 'Delivery Phone' },
  { key: 'vin_number', label: 'VIN Number' },
  { key: 'vehicle_make', label: 'Vehicle Make' },
  { key: 'vehicle_model', label: 'Vehicle Model' },
  { key: 'vehicle_year', label: 'Vehicle Year' },
  { key: 'assigned_admin_name', label: 'Assigned Admin' },
  { key: 'total_amount', label: 'Quote Amount' },
  { key: 'notes', label: 'Notes' },
  { key: 'updated_at', label: 'Last Updated' }
]

export default function DataExport({ 
  data, 
  isOpen, 
  onClose, 
  filename = 'transportation_orders',
  title = 'Export Orders Data'
}: DataExportProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeFields: AVAILABLE_FIELDS.filter(f => f.required).map(f => f.key),
    dateRange: undefined,
    filters: undefined
  })
  const [isExporting, setIsExporting] = useState(false)
  const [currentStep, setCurrentStep] = useState<'format' | 'fields' | 'filters' | 'preview'>('format')

  if (!isOpen) return null

  const handleFieldToggle = (fieldKey: string) => {
    const field = AVAILABLE_FIELDS.find(f => f.key === fieldKey)
    if (field?.required) return // Can't unselect required fields
    
    const isSelected = exportOptions.includeFields.includes(fieldKey)
    setExportOptions(prev => ({
      ...prev,
      includeFields: isSelected 
        ? prev.includeFields.filter(f => f !== fieldKey)
        : [...prev.includeFields, fieldKey]
    }))
  }

  const convertToCSV = (data: ExportData[]): string => {
    const headers = exportOptions.includeFields.map(field => 
      AVAILABLE_FIELDS.find(f => f.key === field)?.label || field
    )
    
    const rows = data.map(row => 
      exportOptions.includeFields.map(field => {
        let value = row[field as keyof ExportData]
        
        // Format dates
        if (field.includes('_at') && value) {
          value = new Date(value as string).toLocaleDateString()
        }
        
        // Handle null/undefined values
        if (value == null) {
          value = ''
        }
        
        // Escape CSV values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`
        }
        
        return value
      }).join(',')
    )
    
    return [headers.join(','), ...rows].join('\n')
  }

  const convertToJSON = (data: ExportData[]): string => {
    const filteredData = data.map(row => {
      const filtered: Record<string, any> = {}
      exportOptions.includeFields.forEach(field => {
        filtered[field] = row[field as keyof ExportData]
      })
      return filtered
    })
    
    return JSON.stringify({
      exported_at: new Date().toISOString(),
      total_records: filteredData.length,
      data: filteredData
    }, null, 2)
  }

  const downloadFile = (content: string, format: string) => {
    const formatInfo = EXPORT_FORMATS.find(f => f.value === format)
    const blob = new Blob([content], { type: formatInfo?.mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      // Simulate processing time for large datasets
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      let content: string
      
      switch (exportOptions.format) {
        case 'csv':
          content = convertToCSV(data)
          break
        case 'json':
          content = convertToJSON(data)
          break
        case 'xlsx':
          // For now, export as CSV - in real implementation you'd use a library like xlsx
          content = convertToCSV(data)
          toast('Excel format exported as CSV - Excel library integration pending', { 
            icon: 'ℹ️',
            duration: 3000 
          })
          break
        case 'pdf':
          // For now, export as CSV - in real implementation you'd use a library like jsPDF
          content = convertToCSV(data)
          toast('PDF format exported as CSV - PDF library integration pending', { 
            icon: 'ℹ️',
            duration: 3000 
          })
          break
        default:
          throw new Error('Unsupported export format')
      }
      
      downloadFile(content, exportOptions.format === 'xlsx' || exportOptions.format === 'pdf' ? 'csv' : exportOptions.format)
      toast.success(`Successfully exported ${data.length} records`)
      onClose()
      
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const getPreviewData = () => {
    return data.slice(0, 3).map(row => {
      const filtered: Record<string, any> = {}
      exportOptions.includeFields.forEach(field => {
        filtered[field] = row[field as keyof ExportData]
      })
      return filtered
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card variant="admin" className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-admin-200">
          <div>
            <h2 className="text-xl font-semibold text-admin-900">{title}</h2>
            <p className="text-sm text-admin-600 mt-1">
              Export {data.length} records in your preferred format
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-admin-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-admin-500" />
          </button>
        </div>

        {/* Steps Navigation */}
        <div className="flex items-center justify-center p-4 border-b border-admin-200 bg-admin-25">
          {['format', 'fields', 'preview'].map((step, index) => (
            <div key={step} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step as any)}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  currentStep === step
                    ? 'bg-admin-600 text-white'
                    : 'bg-admin-200 text-admin-700 hover:bg-admin-300'
                }`}
              >
                {index + 1}
              </button>
              <span className={`ml-2 text-sm font-medium capitalize ${
                currentStep === step ? 'text-admin-900' : 'text-admin-600'
              }`}>
                {step}
              </span>
              {index < 2 && <div className="w-8 h-px bg-admin-300 mx-4" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {currentStep === 'format' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-admin-900">Choose Export Format</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXPORT_FORMATS.map((format) => {
                  const Icon = format.icon
                  return (
                    <button
                      key={format.value}
                      onClick={() => setExportOptions(prev => ({ ...prev, format: format.value }))}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        exportOptions.format === format.value
                          ? 'border-admin-600 bg-admin-50'
                          : 'border-admin-200 hover:border-admin-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className="h-6 w-6 text-admin-600 mt-1" />
                        <div>
                          <div className="font-medium text-admin-900">{format.label}</div>
                          <div className="text-sm text-admin-600 mt-1">{format.description}</div>
                        </div>
                        {exportOptions.format === format.value && (
                          <CheckIcon className="h-5 w-5 text-admin-600 ml-auto" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {currentStep === 'fields' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-admin-900">Select Fields to Export</h3>
                <div className="text-sm text-admin-600">
                  {exportOptions.includeFields.length} of {AVAILABLE_FIELDS.length} selected
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {AVAILABLE_FIELDS.map((field) => (
                  <label
                    key={field.key}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      field.required 
                        ? 'bg-admin-50 border-admin-300 cursor-not-allowed'
                        : 'border-admin-200 hover:border-admin-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={exportOptions.includeFields.includes(field.key)}
                      onChange={() => handleFieldToggle(field.key)}
                      disabled={field.required}
                      className="rounded border-admin-300 text-admin-600 focus:ring-admin-500 disabled:opacity-50"
                    />
                    <span className="ml-3 text-sm text-admin-900">{field.label}</span>
                    {field.required && (
                      <Badge variant="admin" size="sm" className="ml-auto">
                        Required
                      </Badge>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'preview' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-admin-900">Export Preview</h3>
              
              <div className="bg-admin-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-admin-900">Format:</span>
                    <span className="ml-2 text-admin-600">
                      {EXPORT_FORMATS.find(f => f.value === exportOptions.format)?.label}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-admin-900">Records:</span>
                    <span className="ml-2 text-admin-600">{data.length}</span>
                  </div>
                  <div>
                    <span className="font-medium text-admin-900">Fields:</span>
                    <span className="ml-2 text-admin-600">{exportOptions.includeFields.length}</span>
                  </div>
                  <div>
                    <span className="font-medium text-admin-900">Size:</span>
                    <span className="ml-2 text-admin-600">~{Math.round(data.length * exportOptions.includeFields.length * 10 / 1024)}KB</span>
                  </div>
                </div>
              </div>

              <div className="border border-admin-200 rounded-lg overflow-hidden">
                <div className="bg-admin-100 px-4 py-2 border-b border-admin-200">
                  <h4 className="text-sm font-medium text-admin-900">Sample Data (First 3 rows)</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-admin-50">
                        {exportOptions.includeFields.map(field => (
                          <th key={field} className="px-3 py-2 text-left font-medium text-admin-700">
                            {AVAILABLE_FIELDS.find(f => f.key === field)?.label || field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {getPreviewData().map((row, index) => (
                        <tr key={index} className="border-t border-admin-100">
                          {exportOptions.includeFields.map(field => (
                            <td key={field} className="px-3 py-2 text-admin-900">
                              {String(row[field] || '').substring(0, 20)}
                              {String(row[field] || '').length > 20 ? '...' : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-admin-200 bg-admin-25">
          <div className="flex space-x-3">
            {currentStep !== 'format' && (
              <Button
                variant="admin-secondary"
                onClick={() => {
                  const steps = ['format', 'fields', 'preview']
                  const currentIndex = steps.indexOf(currentStep)
                  if (currentIndex > 0) {
                    setCurrentStep(steps[currentIndex - 1] as any)
                  }
                }}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex space-x-3">
            {currentStep !== 'preview' ? (
              <Button
                variant="admin-primary"
                onClick={() => {
                  const steps = ['format', 'fields', 'preview']
                  const currentIndex = steps.indexOf(currentStep)
                  if (currentIndex < steps.length - 1) {
                    setCurrentStep(steps[currentIndex + 1] as any)
                  }
                }}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="admin-primary"
                onClick={handleExport}
                disabled={isExporting}
                icon={<DocumentArrowDownIcon className="h-4 w-4" />}
              >
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}